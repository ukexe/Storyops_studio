# StoryOps Edge API

This Cloudflare Worker is the production deployment adapter for the StoryOps
REST contract. It uses Supabase Auth, PostgREST, and Storage through the
backend-only secret key while enforcing ownership in every handler.

The live adapter calls the OpenAI Responses API for structured text,
high-detail vision analysis, and image generation. It sends bounded inputs with
API storage disabled, validates outputs, persists generated visuals privately,
records `openai/<model>` audit IDs, and falls back to deterministic StoryOps
rules or a transparent visual production brief when inference fails.

The canonical FastAPI implementation remains under `backend/app/` and contains
the full watsonx.ai/Granite integration.

Required Worker secret:

- `SUPABASE_SECRET_KEY`
- `OPENAI_API_KEY`

The non-secret `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL` variables select the
production reasoning and image models.

Validation:

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run typecheck
npm run cf-typecheck
npm run dry-run
```
