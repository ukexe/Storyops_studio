# StoryOps Edge API

This Cloudflare Worker is the production deployment adapter for the StoryOps
REST contract. It uses Supabase Auth, PostgREST, and Storage through the
backend-only secret key while enforcing ownership in every handler.

The canonical FastAPI implementation remains under `backend/app/` and contains
the full watsonx.ai/Granite integration. The edge adapter provides deterministic
analysis agents when IBM credentials or a Python container runtime are not
available. Responses identify this mode through `analysis_mode: "edge-rules"`
and `storyops/edge-*` model IDs; it never labels fallback output as Granite.

Required Worker secret:

- `SUPABASE_SECRET_KEY`

Validation:

```bash
npm ci
npm audit --audit-level=moderate
npm run typecheck
npm run dry-run
```
