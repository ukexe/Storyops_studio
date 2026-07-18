# AGENTS.md — Ask Mode Rules

This file provides guidance to agents when working with code in this repository.

## Documentation Context (Non-Obvious)

- **`docs/research.md` is the canonical reference** — it contains the full scoring rationale, idea database, winning patterns, architecture diagram, DB schema, agent designs, and demo script. Read it before answering any question about project intent or decisions.
- **The project is implemented incrementally** — inspect the current repository
  before answering. `docs/research.md` defines product intent, while
  `docs/implementation-plan.md`, `docs/tasks.md`, and working code define the
  current architecture and completion state.
- **"IBM Bob" in context** — refers to IBM's AI SDLC platform (not a person). Bob has three modes (Agent/Ask/Plan) and judges evaluate its visible use across the full SDLC lifecycle.
- **watsonx ≠ OpenAI API** — watsonx.ai uses IBM IAM token authentication (not API key in Authorization header directly), and model IDs differ. Don't conflate watsonx.ai with standard OpenAI-compatible endpoints.
- **"Creative operations" ≠ "content generation"** — StoryOps Studio intentionally targets workflow orchestration and pipeline intelligence, not image/video generation. This distinction is central to the project's value proposition and IBM alignment.
- **Frontend deployment** — the production Next.js application uses the Cloudflare OpenNext adapter and Wrangler.
