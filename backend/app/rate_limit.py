"""Small authenticated rate limiter for costly API operations."""
from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status

_events: dict[str, deque[float]] = defaultdict(deque)
_lock = asyncio.Lock()


async def enforce_rate_limit(
    key: str,
    *,
    limit: int,
    window_seconds: int,
) -> None:
    now = time.monotonic()
    cutoff = now - window_seconds
    async with _lock:
        events = _events[key]
        while events and events[0] <= cutoff:
            events.popleft()
        if len(events) >= limit:
            retry_after = max(1, int(window_seconds - (now - events[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        events.append(now)

        if len(_events) > 10_000:
            empty_keys = [event_key for event_key, queue in _events.items() if not queue]
            for event_key in empty_keys:
                _events.pop(event_key, None)
