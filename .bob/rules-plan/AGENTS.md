# AGENTS.md — Plan Mode Rules

This file provides guidance to agents when working with code in this repository.

## Architectural Constraints (Non-Obvious)

- **Fixed pipeline stage order is load-bearing** — `Idea → Script → Assets → Edit → Feedback → Publish → Analyze` is defined as a validated constant in backend and frontend code. There is intentionally no `stages` table.
- **Agents must be stateless** — each agent call receives full item context (metadata JSON) as input and returns a self-contained `analyses` record. No shared in-memory state between agent invocations; this is required for watsonx Orchestrate compatibility.
- **Two AI usage tiers by MVP priority:**
  1. *MVP (required):* Brief Agent + Script Agent + Asset Agent via direct watsonx.ai API calls
  2. *Stretch:* Edit Agent, Performance Agent, watsonx Orchestrate multi-agent graphs
- **DB schema forward-only** — use migration files (Alembic for FastAPI, or Supabase migrations); no schema rollbacks in the demo environment.
- **IBM Bob SDLC integration is an architecture concern, not just tooling** — plan for Bob-generated `/docs/architecture.md`, API docs, and test scaffolds to be committed artifacts in the repo. Judges review the repo for evidence of Bob usage.
- **Monorepo root scripts must work from root** — GitHub Actions CI will run from repo root. Any `npm`/`pip` commands scoped to `/frontend` or `/backend` must be called with directory flags (`--prefix`, `-C`, `--cwd`), not by `cd`-ing in the workflow.
- **watsonx Orchestrate is aspirational for this hackathon** — the architecture should be designed so agent calls can be swapped from direct API to orchestrated without restructuring the backend service layer (use an abstraction/interface over agent invocation).
