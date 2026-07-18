# StoryOps Studio Architecture

> Release architecture for StoryOps Studio v1.1.0.

## System architecture

```text
Browser
  │
  │ HTTPS
  ▼
Cloudflare Workers — Next.js 16 through OpenNext
  ├─ Supabase Auth browser/server clients
  ├─ Next.js middleware session refresh and route protection
  ├─ Dashboard, pipeline, item analysis, and task board
  └─ Typed REST client with Supabase bearer token
  │
  │ HTTPS + Authorization: Bearer <Supabase JWT>
  ▼
Cloudflare Worker — production REST adapter
  ├─ Supabase session validation and project ownership checks
  ├─ Project, item, analysis, task, and demo routes
  ├─ Deterministic edge-agent fallback
  └─ Supabase PostgREST and private Storage client
  │
  ▼
Supabase Postgres
  ├─ projects              ├─ Granite Instruct
  ├─ items                 └─ Granite Vision
  ├─ analyses
  └─ tasks

Supabase Storage
  └─ private assets bucket (project-scoped object paths + signed reads)

Canonical FastAPI deployment
  ├─ async SQLAlchemy → Supabase Postgres
  ├─ JWT/JWKS authentication
  └─ IBM watsonx.ai SDK → Granite Instruct and Vision
```

The frontend never receives database credentials or the Supabase secret key.
It authenticates with Supabase Auth and sends the resulting JWT to the REST
adapter. Only backend runtimes—the live adapter or canonical FastAPI service—
can access the four application tables.

## Repository layout

- `frontend/` — Next.js App Router application, shadcn/ui components, typed API
  client, and Supabase SSR integration.
- `backend/` — FastAPI API, SQLAlchemy models, Alembic migrations, agents,
  storage integration, demo fixtures, tests, and the `cloudflare/` production
  REST adapter.
- `docs/` — product research, implementation plan, architecture, task state,
  and demo walkthrough.
- `.github/workflows/` — independent backend and frontend validation.
- `render.yaml` — Render Blueprint for the Dockerized backend.

## Frontend architecture

### Routing

- `/` — public product landing page.
- `/login` and `/register` — Supabase email/password authentication.
- `/auth/confirm` — email OTP or PKCE confirmation callback.
- `/dashboard` — project list, project creation, demo seed, and watsonx health.
- `/projects/[id]` — seven-stage pipeline.
- `/projects/[id]/items/[itemId]` — content preview and AI analysis.
- `/projects/[id]/tasks` — AI-generated task board.
- `/settings` — live service, analysis-mode, and security-boundary status.

`frontend/middleware.ts` is the edge session entry point. It refreshes Supabase
cookies, redirects unauthenticated protected routes to login, and prevents
authenticated users from returning to login or registration.

### API and state

`frontend/lib/api.ts` is the single REST boundary. It:

- reads the current Supabase browser session;
- injects the bearer token;
- parses FastAPI errors consistently;
- supports abort signals and no-store requests;
- sends multipart item uploads without overriding the browser boundary; and
- clears invalid local sessions after a `401`.

Pages own request and mutation state. Presentational components such as
`PipelineBoard`, `AnalysisPanel`, and `TaskCard` receive typed props and do not
perform API calls.

### UI system

The UI uses Tailwind CSS 4 and the shadcn Radix Nova preset. Pages are stacked
on small screens and use multi-column layouts at desktop breakpoints.
Interactive controls expose labels, pressed/busy states, focus indicators, and
polite live announcements.

## Backend architecture

### Production REST adapter

`backend/cloudflare/src/index.ts` is the live API implementation. It preserves
the FastAPI response contract while using Supabase Auth, PostgREST, and Storage
from a standard Cloudflare Worker. Every resource lookup includes an ownership
check. Its deterministic analyses are labeled with `storyops/edge-*` ruleset
IDs, and `/health` reports `analysis_mode: "edge-rules"` rather than
misrepresenting them as Granite output.

### Canonical FastAPI service

### Application lifecycle

`backend/app/main.py` creates the FastAPI application, configures explicit CORS
origins, mounts versioned routers, checks database and watsonx connectivity on
startup, and disposes the SQLAlchemy engine on shutdown.

- `/live` is a process liveness probe.
- `/health` is a dependency-readiness probe and returns `503` after a database
  startup failure.

### Configuration

`backend/app/config.py` loads required settings at import time and rejects blank
values. Production configuration is injected by Render. Secrets are never
copied into the Docker image.

### Authentication and authorization

`backend/app/auth.py` validates Supabase RS256 or ES256 JWTs against the project
JWKS endpoint. It verifies key ID, algorithm, issuer, audience, expiration, and
UUID subject. Unknown keys trigger one JWKS refresh to support key rotation.

Every protected router verifies ownership through `projects.owner_id`. Missing
and cross-tenant resources return `404` to avoid disclosing their existence.

### Routers

- `projects.py` — list, create, read, update, and delete projects.
- `items.py` — grouped pipeline reads, JSON/multipart creation, updates, and
  deletion.
- `analyses.py` — analysis history and synchronous agent invocation.
- `tasks.py` — task listing, filtering, status/priority updates, and deletion.
- `demo.py` — idempotent, authenticated judging demo seed.

Business logic remains in routers unless shared, matching the MVP scope. Agent
selection and persistence are isolated in the dispatcher.

## Agent architecture

### Shared contract

All agents implement:

```text
analyze(item) → AnalysisResult
```

`AnalysisResult` contains an agent type, summary, structured recommendations,
score metrics, model ID, and task drafts. Agents are stateless and receive the
complete persisted item context.

### Agent reference

- `WatsonxClient` — lazy singleton around IBM `ModelInference`; caches model
  interfaces, bounds concurrent inference, applies a request deadline, and
  converts SDK failures into sanitized `WatsonxError` exceptions.
- `BriefAgent` — Granite Instruct analysis of objectives, constraints, missing
  information, and clarity.
- `ScriptAgent` — Granite Instruct analysis of hook strength, pacing, CTA, and
  retention risk.
- `AssetAgent` — Granite Vision analysis of brand consistency and logo
  integrity. Asset downloads are restricted to the configured Supabase public
  bucket.
- `EditAgent` — deterministic scene-duration and pacing analysis from NLE
  metadata.
- `PerformanceAgent` — deterministic retention and click-through analysis.
- `FeedbackAgent` — deterministic extraction of actionable review notes.
- `dispatcher.py` — the only item-type-to-agent map and the transaction
  boundary for analyses and generated tasks.

### Dispatch flow

```text
POST /api/v1/items/{id}/analyze
  1. Validate Supabase JWT.
  2. Fetch the item through its owned project.
  3. Select the agent from AGENT_MAP.
  4. Invoke analyze(item).
  5. Convert AnalysisResult into an analyses row.
  6. Convert task drafts into linked tasks rows.
  7. Commit analysis and tasks atomically.
  8. Return the persisted AnalysisResponse.
```

Analysis is synchronous by design. The frontend preserves the previous result
during re-analysis and does not poll.

## Data model

### `projects`

- UUID primary key
- Supabase Auth owner UUID
- name, description, repository URL
- created and updated timestamps

### `items`

- UUID primary key and project foreign key
- validated stage and item type
- title, text content, optional asset URL
- JSONB metadata
- created and updated timestamps

### `analyses`

- UUID primary key and item foreign key
- agent type, summary, recommendations JSONB, score metrics JSONB
- model/ruleset audit identifier
- created timestamp

### `tasks`

- UUID primary key and project foreign key
- optional linked item foreign key
- title, description, status, and priority
- created and updated timestamps

Stages are fixed constants rather than rows. This removes joins and migration
overhead for a workflow whose order is load-bearing:

```text
Idea → Script → Assets → Edit → Feedback → Publish → Analyze
```

The hardening migration enables RLS and revokes `anon` and `authenticated`
privileges on all application tables. FastAPI's service database connection
therefore remains the only data path. Database CHECK constraints protect stage,
item type, task status, and task priority values.

## Storage

Uploads are limited to 10 MB and accepted only for asset items. Both backend
implementations validate image magic bytes and generate project-scoped object
names. The `assets` bucket is private. API responses contain one-hour signed
read URLs; the database stores only the object path. The FastAPI Asset Agent
downloads private objects through the secret-key client and accepts legacy
public URLs only from the configured Supabase host without redirects.

## Deployment

### Live API

- Cloudflare Worker configuration: `backend/cloudflare/wrangler.jsonc`.
- Live API: `https://storyops-api.ukexe06.workers.dev`.
- Backend-only Supabase secret configured as a Worker secret.
- Deterministic fallback agents keep every workflow functional without
  claiming unavailable IBM inference.

### Canonical FastAPI backend

- Dockerized Python 3.11 service.
- Non-root runtime user.
- `.dockerignore` excludes credentials, caches, tests, and virtual environments.
- Render Blueprint remains available for a Python host with watsonx credentials.
- Uvicorn reads Render's `$PORT`.

### Frontend

- Cloudflare Worker configuration: `frontend/wrangler.jsonc`.
- OpenNext configuration: `frontend/open-next.config.ts`.
- Live frontend: `https://storyops.ukexe06.workers.dev`.
- Production API URL:
  `https://storyops-api.ukexe06.workers.dev/api/v1`.
- Node.js 22.13 or newer.
- Build fails when required public configuration is absent.
- Supabase Auth Site URL and allow-list include the deployed `/auth/confirm`
  route.

## Failure behavior

- Database startup failure: API process remains observable through `/live`, but
  `/health` returns `503`.
- watsonx unavailable: the live adapter explicitly reports `edge-rules` mode;
  the canonical FastAPI service keeps CRUD healthy and returns a sanitized
  gateway error for Granite-only requests.
- Invalid model JSON: no analysis or tasks are committed.
- Demo seed failure: the database transaction is rolled back and the uploaded
  demo thumbnail is cleaned up.
- Task update failure: the frontend rolls back its optimistic move and
  announces the failure.

## IBM Bob usage

IBM Bob is treated as an SDLC workflow partner rather than a code-completion
tool. Repository evidence is organized by Bob's three modes:

### Plan mode

- `docs/research.md` captures problem selection, judging alignment, and product
  scope.
- `docs/implementation-plan.md` records architecture, schema, endpoint, agent,
  and milestone decisions.
- `docs/tasks.md` decomposes the plan into dependency-ordered implementation
  units.
- `.bob/rules-plan/AGENTS.md` preserves load-bearing architecture constraints.

### Agent mode

- Phase work is represented by production source, migrations, tests, Docker,
  Cloudflare, Render, and CI artifacts.
- `.bob/rules-agent/AGENTS.md` constrains Granite access, model IDs, pipeline
  ordering, recommendation shape, and dispatch separation.

### Ask mode

- Repository-wide reviews were used to identify API contract drift, ownership
  gaps, dependency vulnerabilities, unsafe asset fetching, deployment
  configuration issues, and documentation inconsistencies.
- `.bob/rules-ask/AGENTS.md` keeps product intent and watsonx-specific guidance
  available during debugging and review.

This document records repository artifacts, not vendor telemetry. Challenge
submission material should include genuine Bob session screenshots or exports
where required by the judging rules.

## Security boundaries

- Public: landing page, auth pages, `/live`, and `/health`.
- Authenticated: projects, items, analyses, tasks, and demo seeding.
- Secret: Supabase secret key, database URL, and watsonx credentials.
- Browser-visible by design: Supabase project URL, publishable key, and backend
  API URL.

The API implements request-size limits and authenticated analysis/demo
throttles. Cloudflare and Supabase provide deployment observability; alerting,
backup drills, and periodic secret rotation remain operational responsibilities.
