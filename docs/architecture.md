# StoryOps Studio Architecture

> Release architecture for StoryOps Studio v2.1.0.

## StoryOps Studio V2 control plane

V2 preserves StoryOps
as the first creative workflow while adding durable conversations, messages,
workflow runs and steps, reusable artifacts, and an append-only workspace event
ledger. New authenticated routes provide a context-aware AI Asset Studio
and a replay-safe enterprise timeline.

The production schema is applied through revision `73ff11ca1f26`, and both
Cloudflare Workers run v2.1.0. Roadmap-only
capabilities such as embeddings, semantic search, pattern clustering, Knowledge map,
and repository generation are clearly distinguished from implemented behavior.

See [StoryOps V2 control-plane architecture](storyops-v2-control-plane-architecture.md) for the
repository critique, target architecture, control-plane flow, data contracts,
explainability model, timeline semantics, and dependency-ordered rollout.

## System architecture

```text
Browser
  │
  │ HTTPS
  ▼
Cloudflare Workers — Next.js 16 through OpenNext
  ├─ Supabase Auth browser/server clients
  ├─ Next.js middleware session refresh and route protection
  ├─ Dashboard, pipeline, analysis, tasks, AI Asset Studio, and timeline
  └─ Typed REST client with Supabase bearer token
  │
  │ HTTPS + Authorization: Bearer <Supabase JWT>
  ▼
Cloudflare Worker — production REST adapter
  ├─ Supabase session validation and project ownership checks
  ├─ Domain CRUD, control-plane, artifact, run, and event routes
  ├─ OpenAI structured text and vision analysis
  ├─ Context-aware console synthesis
  ├─ Deterministic edge-agent fallback
  └─ Supabase PostgREST and private Storage client
  │                              │
  ▼                              ▼
Supabase Postgres          OpenAI Responses API
  ├─ projects
  ├─ items
  ├─ analyses
  ├─ tasks
  ├─ conversations + messages
  ├─ workflow runs + steps
  ├─ artifacts
  └─ workspace events

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
can access application and control-plane tables.

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
- `/dashboard` — project list, project creation, demo seed, and provider health.
- `/projects/[id]` — seven-stage pipeline.
- `/projects/[id]/items/[itemId]` — content preview and AI analysis.
- `/projects/[id]/tasks` — AI-generated task board.
- `/projects/[id]/console` — context-aware AI Asset Studio, rich asset preview,
  and reloadable run trace.
- `/projects/[id]/timeline` — searchable, correlation-aware event timeline.
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
check. OpenAI analyses use strict structured output and `openai/<model>` audit
IDs. Inference failures activate deterministic `storyops/edge-*` rules and are
logged without exposing creative input or credentials. `/health` and Settings
report the active provider and fallback mode.

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

### Production OpenAI provider

The live adapter uses `gpt-5.6-luna` through the OpenAI Responses API:

- strict JSON Schema output for summaries, recommendations, priorities, and
  metrics;
- text analysis for briefs, scripts, edits, feedback, and performance data;
- high-detail multimodal input for private user assets and the demo thumbnail;
- GPT Image 1.5 generation for original project visuals, stored privately;
- `store: false`, bounded content/metadata/output, and explicit deadlines;
- no model-side mutating tools—the only hosted tool is image generation;
- application-side output validation and capped task generation; and
- deterministic rules fallback with a different audit ID on any provider error.

Creative input is sent to OpenAI only when the provider is configured. The API
key remains a Cloudflare Worker secret and never reaches the browser.

### Canonical FastAPI agent reference

- `WatsonxClient` — lazy singleton around IBM `ModelInference`; caches model
  interfaces, bounds concurrent inference, applies a request deadline, and
  converts SDK failures into sanitized `WatsonxError` exceptions.
- `BriefAgent` — Granite Instruct analysis of objectives, constraints, missing
  information, and clarity.
- `ScriptAgent` — Granite Instruct analysis of hook strength, pacing, CTA, and
  retention risk.
- `AssetAgent` — Granite Vision analysis of brand consistency and logo
  integrity. Asset downloads are restricted to the configured Supabase private
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

### `conversations` and `conversation_messages`

- Project and owner-scoped durable conversations
- User, assistant, tool, and system messages
- Optional workflow-run link
- Agent, model, tool-receipt, context, and timestamp metadata

### `workflow_runs` and `workflow_steps`

- Objective, run type, lifecycle status, progress, current agent, and confidence
- Ordered specialist/tool steps with input/output summaries and dependencies
- Model ID, prompt version, and optional replay-source run
- Reloadable steps and a failure-ready state model

### `artifacts`

- Project, conversation, source-message, and workflow-run lineage
- Type, title, content, format, MIME type, status, version, and metadata
- Private generated-media object path with expiring signed preview
- Model, prompt, confidence, content hash, and source-snapshot audit data

### `workspace_events`

- Application append-only user, agent, tool, workflow, and system events
- Actor, object, run, artifact, correlation, and causation links
- Human-readable summary, structured payload, model ID, and reversibility marker

Stages are fixed constants rather than rows. This removes joins and migration
overhead for a workflow whose order is load-bearing:

```text
Idea → Script → Assets → Edit → Feedback → Publish → Analyze
```

The hardening migrations enable RLS and revoke `anon` and `authenticated`
privileges on all application, control-plane, and migration metadata tables.
Only trusted backend runtimes use privileged data access. Database CHECK
constraints protect stage, item type, task state, control-plane lifecycle,
progress, confidence, message role, and artifact version values.

## Storage

Uploads are limited to 10 MB and accepted only for asset items. Both backend
implementations validate image magic bytes and generate project-scoped object
names. The `assets` bucket is private. API responses contain one-hour signed
read URLs; the database stores only the object path. The FastAPI Asset Agent
downloads private objects through the secret-key client and accepts legacy
public URLs only from the configured Supabase host without redirects.

Generated visual artifacts use the same private bucket and a project-scoped
object path. Artifact responses hydrate a signed URL only after project
ownership is verified. Project deletion cleans up both uploaded item assets and
generated visual artifacts.

## Deployment

### Live API

- Cloudflare Worker configuration: `backend/cloudflare/wrangler.jsonc`.
- Live API: `https://storyops-api.ukexe06.workers.dev`.
- v2.1.0 Worker version: `fc45b72e-e5c0-4cb5-9fa4-764a7dcb9a67`.
- Backend-only Supabase and OpenAI keys configured as Worker secrets.
- `gpt-5.6-luna` provides production text and vision analysis.
- Deterministic fallback agents keep every workflow functional and use
  visibly different model IDs.

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
- v2.1.0 Worker version: `4e536aff-efff-4e6f-8aaf-6b3b1bd2ef26`.
- Production API URL:
  `https://storyops-api.ukexe06.workers.dev/api/v1`.
- Node.js 22.13 or newer.
- Build fails when required public configuration is absent.
- Supabase Auth Site URL and allow-list include the deployed `/auth/confirm`
  route.

## Failure behavior

- Database startup failure: API process remains observable through `/live`, but
  `/health` returns `503`.
- OpenAI unavailable: the live adapter logs a sanitized provider failure,
  persists deterministic analysis, and records a `storyops/edge-*` model ID.
- watsonx unavailable: the canonical FastAPI service keeps CRUD healthy and
  returns a sanitized gateway error for Granite-only requests.
- Invalid production model JSON: the edge API records an explicit deterministic
  fallback result; the canonical Granite path returns a sanitized error without
  committing analysis or tasks.
- Console failure: the run is marked failed and a correlated failure event is
  persisted without creating an artifact.
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
- `.bob/rules-agent/AGENTS.md` constrains provider disclosure, server-side
  secrets, Granite access, model IDs, pipeline ordering, recommendation shape,
  and dispatch separation.

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
- Secret: Supabase secret key, OpenAI key, database URL, and watsonx
  credentials.
- Browser-visible by design: Supabase project URL, publishable key, and backend
  API URL.

The API implements request-size limits and authenticated analysis/demo
throttles. Cloudflare and Supabase provide deployment observability; alerting,
backup drills, and periodic secret rotation remain operational responsibilities.
