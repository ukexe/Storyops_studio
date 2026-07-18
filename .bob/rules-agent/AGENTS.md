# AGENTS.md — Agent Mode Rules

This file provides guidance to agents when working with code in this repository.

## Coding Rules (Non-Obvious)

- **IBM Bob is the stated primary dev tool** — when writing code, commit messages, and PR descriptions should reference Bob usage (judges evaluate this). Document Bob-driven workflows in `/docs/architecture.md`.
- **watsonx.ai API pattern:** All Granite model calls must go through the watsonx.ai inference endpoint. Use `ibm-watsonx-ai` Python SDK or REST calls with Bearer token from IAM — not direct Hugging Face endpoints.
- **Granite model IDs change** — always use the versioned model ID from the watsonx.ai model catalog (e.g., `ibabogaeva/granite-3-8b-instruct`), never rely on short aliases that may resolve differently across regions.
- **Supabase vs IBM Cloud DB:** If using Supabase for Postgres, the connection string format differs from standard Postgres — use the pooled connection string for serverless Next.js API routes (not the direct connection).
- **Pipeline stage ordering is fixed:** `Idea → Script → Assets → Edit → Feedback → Publish → Analyze` — this order is defined in shared constants and drives the data model. There is no `stages` table.
- **`analyses.recommendations` is a JSON column** — store structured arrays, not plain text; the frontend card components will render from this structure.
- **Agent triggers are event-driven:** POST to `/items/{id}/analyze` triggers the correct agent based on `item.type`. Don't couple agent selection logic to the route layer — keep a dispatch map in the AI service layer.
- **Multi-agent orchestration is a stretch goal** — MVP uses sequential single-agent calls per item type. Don't over-engineer watsonx Orchestrate integration for the hackathon MVP.
- **Environment variables required before any backend startup:** `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL` — absence causes silent failures in some SDK versions; add explicit startup validation.
