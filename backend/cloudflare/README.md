# StoryOps Edge API

This Cloudflare Worker is the production deployment adapter for the StoryOps
REST contract. It uses Supabase Auth, PostgREST, and Storage through the
backend-only secret key while enforcing ownership in every handler.

The live adapter calls the OpenAI Responses API for structured text and vision
analysis. It sends bounded inputs with API storage disabled, validates the
structured response, records `openai/<model>` audit IDs, and falls back to
deterministic agents with `storyops/edge-*` IDs when inference fails.

The canonical FastAPI implementation remains under `backend/app/` and contains
the full watsonx.ai/Granite integration.

Required Worker secret:

- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`

The non-secret `OPENAI_MODEL` variable selects the production model.

Validation:

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run dry-run
```
