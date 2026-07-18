"""Async-friendly wrapper around the IBM watsonx.ai Python SDK."""
from __future__ import annotations

import asyncio
import base64
from typing import Literal

from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

from app.config import settings

WatsonxStatus = Literal["unknown", "connected", "error"]
INFERENCE_TIMEOUT_SECONDS = 90
REQUIRED_MODEL_IDS = (
    "ibm/granite-3-8b-instruct",
    "ibm/granite-vision-3-2-2b",
)


class WatsonxError(RuntimeError):
    """Raised when watsonx.ai authentication or inference fails."""


class WatsonxClient:
    """Own the watsonx.ai SDK client and cache model interfaces by model ID."""

    def __init__(self, api_key: str, project_id: str, url: str) -> None:
        self.project_id = project_id
        self.url = url.rstrip("/")
        self._models: dict[str, ModelInference] = {}
        self._inference_semaphore = asyncio.Semaphore(4)

        try:
            credentials = Credentials(api_key=api_key, url=self.url)
            self._api_client = APIClient(
                credentials=credentials,
                project_id=self.project_id,
            )
        except Exception as exc:  # SDK exposes several authentication error types
            raise WatsonxError("Unable to initialize the watsonx.ai client") from exc

    def _model(self, model_id: str) -> ModelInference:
        if not model_id or "/" not in model_id:
            raise WatsonxError(
                "watsonx.ai model IDs must be fully qualified, for example "
                "'ibm/granite-3-8b-instruct'"
            )

        model = self._models.get(model_id)
        if model is None:
            try:
                model = ModelInference(model_id=model_id, api_client=self._api_client)
            except Exception as exc:
                raise WatsonxError(
                    f"Unable to initialize watsonx.ai model '{model_id}'"
                ) from exc
            self._models[model_id] = model
        return model

    async def check_connection(self) -> None:
        """Verify credentials and availability of every configured model."""
        try:
            for model_id in REQUIRED_MODEL_IDS:
                result = await asyncio.to_thread(
                    self._api_client.foundation_models.get_model_specs,
                    model_id=model_id,
                    limit=1,
                )
                resources = result.get("resources", []) if isinstance(result, dict) else []
                if not resources:
                    raise WatsonxError(
                        f"Required watsonx.ai model is unavailable: {model_id}"
                    )
        except Exception as exc:
            _set_connection_status("error")
            raise WatsonxError("watsonx.ai connectivity check failed") from exc
        _set_connection_status("connected")

    async def generate_text(
        self,
        model_id: str,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1024,
    ) -> str:
        """Generate text without blocking FastAPI's event loop."""
        if max_tokens <= 0:
            raise ValueError("max_tokens must be greater than zero")

        prompt = (
            "System instructions:\n"
            f"{system_prompt.strip()}\n\n"
            "User input:\n"
            f"{user_prompt.strip()}\n\n"
            "Assistant response:\n"
        )

        try:
            async with self._inference_semaphore:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._model(model_id).generate_text,
                        prompt=prompt,
                        params={
                            "decoding_method": "greedy",
                            "max_new_tokens": max_tokens,
                        },
                    ),
                    timeout=INFERENCE_TIMEOUT_SECONDS,
                )
        except WatsonxError:
            _set_connection_status("error")
            raise
        except Exception as exc:
            _set_connection_status("error")
            raise WatsonxError(
                f"watsonx.ai text generation failed for model '{model_id}'"
            ) from exc

        if not isinstance(response, str):
            raise WatsonxError("watsonx.ai returned an unexpected text response")

        _set_connection_status("connected")
        return response

    async def analyze_image(
        self,
        model_id: str,
        image_bytes: bytes,
        prompt: str,
    ) -> str:
        """Send an in-memory image to a watsonx.ai vision model."""
        if not image_bytes:
            raise ValueError("image_bytes cannot be empty")

        encoded_image = base64.b64encode(image_bytes).decode("ascii")
        mime_type = _detect_image_mime_type(image_bytes)
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt.strip()},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{encoded_image}",
                        },
                    },
                ],
            }
        ]

        try:
            async with self._inference_semaphore:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._model(model_id).chat,
                        messages=messages,
                        params={"max_tokens": 1024, "temperature": 0},
                    ),
                    timeout=INFERENCE_TIMEOUT_SECONDS,
                )
            content = response["choices"][0]["message"]["content"]
        except WatsonxError:
            _set_connection_status("error")
            raise
        except (KeyError, IndexError, TypeError) as exc:
            _set_connection_status("error")
            raise WatsonxError(
                "watsonx.ai returned an unexpected image-analysis response"
            ) from exc
        except Exception as exc:
            _set_connection_status("error")
            raise WatsonxError(
                f"watsonx.ai image analysis failed for model '{model_id}'"
            ) from exc

        if not isinstance(content, str):
            raise WatsonxError("watsonx.ai returned non-text image analysis content")

        _set_connection_status("connected")
        return content


def _detect_image_mime_type(image_bytes: bytes) -> str:
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
        return "image/gif"
    if image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


_client: WatsonxClient | None = None
_connection_status: WatsonxStatus = "unknown"


def _set_connection_status(value: WatsonxStatus) -> None:
    global _connection_status
    _connection_status = value


def get_connection_status() -> WatsonxStatus:
    """Return the latest observed watsonx.ai connection state."""
    return _connection_status


def get_client() -> WatsonxClient:
    """Return the process-wide watsonx.ai client."""
    global _client
    if _client is None:
        try:
            _client = WatsonxClient(
                api_key=settings.WATSONX_API_KEY,
                project_id=settings.WATSONX_PROJECT_ID,
                url=settings.WATSONX_URL,
            )
        except WatsonxError:
            _set_connection_status("error")
            raise
    return _client
