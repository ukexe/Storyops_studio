# StoryOps Studio

[![Release](https://img.shields.io/badge/release-v1.2.0-111827)](#release-status)
[![Backend CI](https://github.com/ukexe/Storyops_studio/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ukexe/Storyops_studio/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/ukexe/Storyops_studio/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ukexe/Storyops_studio/actions/workflows/frontend-ci.yml)
[![Live on Cloudflare](https://img.shields.io/badge/live-Cloudflare%20Workers-f97316)](https://storyops.ukexe06.workers.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-2563eb)](LICENSE)

StoryOps Studio is an AI-powered Creative Operations Command Center for
YouTube teams, agencies, and in-house creative organizations. It brings briefs,
scripts, visual assets, edits, feedback, publishing, and performance signals
into one production pipeline.

Instead of generating finished creative work from one prompt, StoryOps uses
specialized agents to inspect each stage. The agents identify missing brief
information, script retention risks, visual brand problems, edit pacing issues,
performance opportunities, and actionable reviewer feedback. Their structured
recommendations become linked tasks that teams can manage through completion.

StoryOps Studio was designed for the IBM AI Builders Challenge 2026 theme
**Reimagine Creative Industries with AI**.

- Live frontend: [storyops.ukexe06.workers.dev](https://storyops.ukexe06.workers.dev)
- Live API: [storyops-api.ukexe06.workers.dev](https://storyops-api.ukexe06.workers.dev/health)
- GitHub: [ukexe/Storyops_studio](https://github.com/ukexe/Storyops_studio)
- Release: v1.2.0

## Product capabilities

- Supabase email/password authentication and protected workspaces
- Seven-stage creative pipeline:
  `Idea → Script → Assets → Edit → Feedback → Publish → Analyze`
- Text and image item ingestion
- OpenAI text and vision analysis in the live production API
- IBM Granite brief, script, and vision agents in the canonical FastAPI service
- Deterministic fallback agents when the hosted provider is unavailable
- Structured scores and priority-labelled recommendations
- AI-generated task board with optimistic status updates
- One-click, idempotent judging demo seed
- Read-only production service and security settings
- Responsive and keyboard-accessible Next.js interface

## Architecture

```text
Browser → Cloudflare Workers / Next.js → Cloudflare Worker REST adapter
                                             ├─ Supabase Postgres
                                             ├─ Supabase private Storage
                                             └─ OpenAI Responses API

Canonical FastAPI service → Supabase + IBM watsonx.ai / Granite
```

The browser authenticates through Supabase Auth and forwards a JWT to the live
REST adapter. The adapter validates the session with Supabase Auth, applies
project ownership checks, and accesses Postgres and private Storage with a
backend-only secret. The canonical FastAPI implementation provides the same
contract using JWT/JWKS validation and async SQLAlchemy.

Application tables are protected from direct browser Data API access. The
hardening migration enables RLS, revokes browser-role privileges, and adds
database constraints.

See [docs/architecture.md](docs/architecture.md) for component boundaries,
data flow, security controls, agent dispatch, deployment, and failure behavior.

## Technology

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- Backend: FastAPI/Python canonical service plus a TypeScript Cloudflare Worker
  production adapter
- Identity and storage: Supabase Auth and Storage
- Database: Supabase PostgreSQL
- AI: OpenAI Responses API in production; IBM watsonx.ai/Granite in the
  canonical FastAPI service; deterministic edge fallback
- Deployment: Cloudflare Workers for the frontend and live API; Render Blueprint
  retained for the full Python/watsonx runtime
- CI: GitHub Actions

## AI providers

The live Cloudflare API uses OpenAI for structured text and vision analysis.
Requests use strict JSON schemas, bounded input/output, low-detail image input,
and `store: false`. Every persisted analysis records an
`openai/<model-id>` audit identifier. If OpenAI is unavailable, StoryOps uses
its deterministic rules and records a `storyops/edge-*` identifier.

Production Worker configuration:

- Secret: `OPENAI_API_KEY`
- Model: `OPENAI_MODEL` — currently `gpt-5.6-luna`

Never expose the OpenAI key through `NEXT_PUBLIC_*` values or commit it to the
repository.

### IBM Granite and watsonx.ai

The canonical FastAPI AI agents call IBM watsonx.ai through one SDK wrapper:

- Brief Agent — objectives, constraints, missing information, clarity score
- Script Agent — hook strength, pacing, CTA, retention risk
- Asset Agent — brand consistency, logo integrity, visual issues

The wrapper caches model interfaces, limits concurrent inference, applies
request deadlines, and sanitizes SDK failures.

Rules-based agents cover edit timing, performance metrics, and reviewer
feedback without pretending to call a model. `/health`, Settings, and analysis
model IDs always disclose the active provider.

Required IBM configuration:

- `WATSONX_API_KEY`
- `WATSONX_PROJECT_ID`
- `WATSONX_URL` — normally `https://us-south.ml.cloud.ibm.com`

## IBM Bob usage

IBM Bob is represented as an SDLC partner across the repository:

- Plan mode — research, architecture, schema, milestones, and dependency-ordered
  tasks in `docs/`
- Agent mode — application source, migrations, tests, CI, and deployment
  artifacts
- Ask mode — repository audits, API contract validation, security review, and
  release hardening

Bob-specific rules are stored under `.bob/`. The architecture document includes
a detailed [IBM Bob usage record](docs/architecture.md#ibm-bob-usage).
Challenge submission material should include genuine Bob session screenshots or
exports in addition to repository artifacts.

## Quick start

### Prerequisites

- Python 3.11
- Node.js 22.13 or newer
- npm
- Supabase project
- IBM Cloud account with a watsonx.ai project and model entitlement

Docker is optional for local development and required only for container
validation.

### 1. Configure Supabase

1. Create a Supabase project.
2. Copy the project URL, publishable key, secret key, and session-pooler
   connection string.
3. Run Alembic; migrations create the private `assets` Storage bucket.
4. Add local and deployed `/auth/confirm` URLs to Auth redirect URLs.
5. Do not grant browser roles access to the four application tables; Alembic
   applies the restrictive table policy.

Use the session pooler on port `5432` for the persistent Render backend. The
username has the form `postgres.<project-ref>`.

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install and configure:

```bash
python -m pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Fill every required value in `backend/.env`, then run:

```bash
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; OpenAPI documentation is at
`http://localhost:8000/docs`.

### 3. Start the frontend

```bash
cd frontend
npm ci
cp .env.local.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
npm run dev
```

Fill the frontend values before starting:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

`NEXT_PUBLIC_API_URL` is optional for the public homepage and Supabase Auth. It
is required for the full StoryOps dashboard and agent workflow.

Open `http://localhost:3000`.

## Environment reference

Backend secrets:

- `DATABASE_URL`
- `SUPABASE_SECRET_KEY`
- `WATSONX_API_KEY`
- `WATSONX_PROJECT_ID`

Backend runtime configuration:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_JWKS_URL`
- `WATSONX_URL`
- `ENVIRONMENT`
- `CORS_ORIGINS` — comma-separated exact frontend origins
- `ALLOW_ANONYMOUS_DEMO_SEED` — keep `false` in production

Live edge Worker:

- Secret: `OPENAI_API_KEY`
- Secret: `SUPABASE_SECRET_KEY`
- Variable: `OPENAI_MODEL`

Frontend public build configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_URL`

Variables prefixed with `NEXT_PUBLIC_` are intentionally browser-visible.
Never expose the Supabase secret, database URL, OpenAI key, or watsonx API key.

## Demo

1. Register or sign in.
2. Confirm that the dashboard reports **OpenAI active**.
3. Select **Seed demo**.
4. Open the generated project and inspect its four pipeline items.
5. Review the Brief, Script, and Asset analyses.
6. Open **Tasks** and move a recommendation to **In progress**.

The seed endpoint is authenticated and idempotent per user. The live deployment
performs real OpenAI text and vision calls and labels the model used.

See [docs/demo-walkthrough.md](docs/demo-walkthrough.md) for the complete
judging flow and acceptance checks.

## Validation

Backend:

```bash
cd backend
python -m pip_audit -r requirements.txt
python -m ruff check app tests migrations
python -m pytest tests -q
python -m alembic heads
```

Production edge API:

```bash
cd backend/cloudflare
npm ci
npm audit --audit-level=moderate
npm test
npm run typecheck
npm run dry-run
```

Frontend:

```bash
cd frontend
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run build
```

Container:

```bash
docker build --pull -t storyops-backend ./backend
```

GitHub Actions run the same checks on pushes and pull requests to `main`.

## Deployment

- Live API: `backend/cloudflare/wrangler.jsonc` deploys the authenticated REST
  adapter to
  [storyops-api.ukexe06.workers.dev](https://storyops-api.ukexe06.workers.dev).
- Full Python API: import [render.yaml](render.yaml) to deploy FastAPI with real
  watsonx credentials when a Python container host is available.
- Frontend: `frontend/wrangler.jsonc` and OpenNext deploy
  [storyops.ukexe06.workers.dev](https://storyops.ukexe06.workers.dev).
- Supabase: Alembic revision `b91f4d8a2c10` is applied; Auth production URLs,
  restrictive table grants, RLS, constraints, and the private `assets` bucket
  are verified.

## Release status

Production release: **v1.2.0**

The Cloudflare frontend and API, Supabase Auth/database/private Storage, full
authenticated browser journey, dependency audits, migrations, tests, and
Linux OpenNext build are verified. OpenAI is the disclosed production provider;
the canonical watsonx/Granite path remains available when IBM credentials are
obtained.

## Documentation

- [Architecture](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Task status](docs/tasks.md)
- [Demo walkthrough](docs/demo-walkthrough.md)
- [Engineering report](docs/release-report.md)
- [Product and competition research](docs/research.md)

## License

StoryOps Studio is available under the [MIT License](LICENSE).
