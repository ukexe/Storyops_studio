<div align="center">

<img src="docs/assets/storyops-hero.svg" alt="StoryOps Studio — AI Creative Operations & Asset Studio" width="100%" />

# StoryOps Studio — AI Creative Operations & Asset Studio

### An explainable AI operating system for creative production and reusable intelligence

[![Release](https://img.shields.io/badge/release-v2.1.0-111827?style=flat-square)](CHANGELOG.md)
[![Backend CI](https://img.shields.io/github/actions/workflow/status/ukexe/Storyops_studio/backend-ci.yml?branch=main&label=backend%20CI&style=flat-square)](https://github.com/ukexe/Storyops_studio/actions/workflows/backend-ci.yml)
[![Frontend CI](https://img.shields.io/github/actions/workflow/status/ukexe/Storyops_studio/frontend-ci.yml?branch=main&label=frontend%20CI&style=flat-square)](https://github.com/ukexe/Storyops_studio/actions/workflows/frontend-ci.yml)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white&style=flat-square)](https://storyops.ukexe06.workers.dev)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white&style=flat-square)](frontend)
[![FastAPI](https://img.shields.io/badge/FastAPI-canonical-009688?logo=fastapi&logoColor=white&style=flat-square)](backend)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3fcf8e?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-2563eb?style=flat-square)](LICENSE)

[Live application](https://storyops.ukexe06.workers.dev) ·
[Live API health](https://storyops-api.ukexe06.workers.dev/health) ·
[Architecture](docs/architecture.md) ·
[V2 design](docs/storyops-v2-control-plane-architecture.md) ·
[Demo walkthrough](docs/demo-walkthrough.md)

Built for the **IBM AI Builders Challenge 2026** — *Reimagine Creative Industries with AI*

</div>

---

## Overview

StoryOps Studio is an AI-powered Creative Operations Command Center for
YouTube teams, agencies, studios, and in-house creative organizations. It
brings briefs, scripts, visual assets, edits, reviewer feedback, publishing
readiness, and performance signals into one governed workflow.

StoryOps Studio extends that workflow with an enterprise control plane:

- A project-aware AI Asset Studio
- Durable conversations, workflow runs, and transparent steps
- Reusable report and architecture artifacts
- An append-only workspace event timeline
- Correlation, provenance, confidence, model, and tool audit data
- Replay planning that creates a new run instead of rewriting history

The result is not a generic chat interface. StoryOps turns creative evidence
into structured analysis, accountable work, reusable knowledge, and measurable
operational decisions.

## Release status

**v2.1.0 is live.** The production schema is applied through
`73ff11ca1f26`; API Worker v2.1.0 and the Linux-built OpenNext frontend are
deployed and production-smoke-tested. See
[`docs/release-report.md`](docs/release-report.md) for version IDs and evidence.

## The problem

Creative delivery is fragmented:

- Briefs live in documents.
- Scripts live in separate editors.
- Thumbnails and visual assets live in storage tools.
- Edit decisions stay inside NLEs.
- Feedback is scattered across email and chat.
- Performance metrics arrive after the production context is lost.

Most AI products generate more content but do not solve coordination, quality
control, traceability, or learning. Teams repeatedly discover missing
requirements late, make expensive revisions, lose institutional knowledge, and
cannot explain why an AI recommendation should be trusted.

## The solution

StoryOps provides one continuous workflow:

```text
Creative input
  → specialized analysis
  → evidence-backed recommendation
  → linked team task
  → reusable artifact
  → auditable event timeline
  → future performance learning
```

Humans retain creative judgment. AI identifies risk, structures evidence,
recommends action, and reduces coordination work.

## Key features

### Production workflow

- Seven-stage pipeline: `Idea → Script → Assets → Edit → Feedback → Publish → Analyze`
- Text, image, edit-timeline, feedback, and performance-metric ingestion
- Private image storage with signed previews
- Brief, Script, Asset, Edit, Feedback, and Performance analysis modes
- Structured scores and priority-labelled recommendations
- Generated tasks linked to their source item
- Optimistic task status changes with rollback
- One-click, authenticated, idempotent judging demo

### AI Asset Studio

- Eight guided asset categories: Documentation, Visual, Architecture,
  Engineering, Product, Business, Marketing, and Analytics
- Professional Markdown and GFM rendering with headings, lists, tables,
  callouts, links, and responsive typography
- Syntax-highlighted code and structured JSON downloads
- Rendered Mermaid architecture, sequence, ER, workflow, Gantt, KPI, and
  burndown visuals with SVG export
- OpenAI image generation for original illustrations, storyboards, concepts,
  logos, covers, banners, thumbnails, and campaign graphics
- Generated images persisted in private Supabase Storage with signed previews
- First-class artifact format, MIME type, storage path, model ID, run lineage,
  prompt version, and SHA-256 integrity metadata
- Deterministic, clearly labelled production briefs when hosted image
  generation is unavailable

### StoryOps intelligence control plane

- Persistent project conversations
- Context-aware AI Asset Studio
- Transparent workflow runs and steps
- Typed tool-call receipts
- Model and deterministic-fallback audit IDs
- Confidence and recommended next actions
- Reusable documents, diagrams, code, analytics, and visual assets
- Searchable workspace timeline
- Correlation and causation across chat, runs, tools, and artifacts
- Evidence-grounded replay linked to the original run and event

### Trust and operations

- Supabase JWT authentication
- Per-project ownership checks
- RLS-enabled application tables
- Revoked browser table privileges
- Private Storage bucket and signed reads
- Exact-origin CORS
- Bounded model inputs and outputs
- OpenAI API storage disabled with `store: false`
- Automatic Cloudflare invocation logs disabled to avoid retaining auth headers
- Explicit provider disclosure and fallback behavior
- Dependency audits, secret-history scanning, linting, tests, and bundle checks

## Why StoryOps is different

1. **AI operates the workflow, not just a text box.**  
   Model output becomes structured analyses, tasks, artifacts, workflow steps,
   UI actions, and timeline events.

2. **Specialists are matched to creative evidence.**  
   A brief is evaluated differently from a script, image, edit timeline,
   performance record, or reviewer note.

3. **Every result identifies its execution path.**  
   Analyses and console messages retain agent type, model ID, tools,
   confidence, run IDs, and correlation metadata.

4. **Failure remains useful and visible.**  
   Production inference falls back to deterministic StoryOps rules with a
   distinct audit ID rather than silently pretending the hosted model ran.

5. **The IBM path is real, not a slide.**  
   The canonical FastAPI service contains working Granite Instruct and Granite
   Vision integrations through `ibm-watsonx-ai`.

6. **The platform is honest about maturity.**  
   The homepage labels capabilities as **Live**, **V2 foundation**, or
   **Roadmap**. Semantic search, persisted Knowledge map graphs, and repository
   generation are not marketed as deployed features.

## Product tour

1. Register or sign in.
2. Select **Seed demo** on the dashboard.
3. Inspect the seven-stage creative pipeline.
4. Open the Brief, Script, and Asset analyses.
5. Review scores, recommendations, model IDs, and generated tasks.
6. Move a task to **In progress**.
7. Open **AI Asset Studio** and request a workspace analysis or executive report.
8. Inspect the run trace, selected tools, confidence, and generated artifact.
9. Open **Timeline** to trace the complete workflow and prepare a replay plan.

The full judging script is documented in
[`docs/demo-walkthrough.md`](docs/demo-walkthrough.md).

---

## AI in our solution

### What the AI actually does

StoryOps uses AI to inspect creative and operational evidence:

- **Brief Agent** — extracts objectives, constraints, information gaps, and
  clarity.
- **Script Agent** — evaluates opening hook, pacing, CTA, narrative clarity,
  and retention risk.
- **Asset Agent** — analyzes hierarchy, legibility, brand consistency, and
  logo integrity from private images.
- **Edit Agent** — evaluates scene duration and pacing from structured timeline
  metadata.
- **Feedback Agent** — converts reviewer notes into actionable work.
- **Performance Agent** — interprets views, retention, and click-through rate.
- **Operating-console specialists** — synthesize current workspace evidence,
  explain confidence, propose next actions, and create reusable executive or
  architecture artifacts.

### Why AI is necessary

These inputs are heterogeneous and contextual. A fixed form can store them, but
cannot consistently identify ambiguity, narrative risk, visual quality,
cross-stage implications, or the highest-leverage next action. AI allows
StoryOps to interpret unstructured text and images while deterministic
validation and rules protect the workflow boundary.

### Why this is more than a ChatGPT wrapper

The model never receives an unconstrained prompt and returns disposable prose.
The application:

1. Authenticates and authorizes the user.
2. Loads only the owned project context.
3. Selects a specialist and bounded local tools.
4. Builds a typed, size-limited context snapshot.
5. Separates untrusted creative content from system instructions.
6. Requests strict structured output.
7. Validates summaries, recommendations, metrics, confidence, and artifact data.
8. Persists model and fallback audit IDs.
9. Converts recommendations into linked tasks.
10. Persists console turns as runs, steps, messages, artifacts, and events.
11. Exposes the execution trace to the user.
12. Falls back to deterministic logic when hosted inference fails.

### Prompt engineering strategy

Prompts are:

- Specialist-specific
- Explicit about output schemas
- Bounded by content and metadata limits
- Grounded in the current item or workspace snapshot
- Instructed to treat creative content as untrusted data
- Required to acknowledge missing evidence
- Optimized for concise, actionable recommendations
- Version-auditable through model/ruleset identifiers

The production Worker uses the OpenAI Responses API with strict JSON Schema,
low reasoning effort for predictable latency, and `store: false`. The only
model-side tool is bounded image generation; server-side code owns storage,
authorization, mutation policy, and audit persistence.

### Context handling

Item analysis receives one persisted item and its validated metadata. The
AI Asset Studio assembles a bounded snapshot containing:

- Project identity and description
- Current item, stage, and type distribution
- Latest available analyses and model IDs
- Open and completed tasks
- Current page and inspector context
- Recent messages and reusable artifact excerpts
- Persisted source run, steps, events, and artifacts for replay requests

The context boundary is project-scoped and enforced server-side.

### Model interaction and response pipeline

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js workspace
    participant API as Authenticated API
    participant Context as Context assembler
    participant Agent as Specialist agent
    participant Model as OpenAI / Granite
    participant DB as Supabase Postgres

    User->>UI: Analyze, explain, or generate
    UI->>API: JWT + command + page context
    API->>API: Verify project ownership
    API->>DB: Create conversation message and workflow run
    API->>Context: Load bounded workspace evidence
    Context-->>Agent: Typed snapshot
    Agent->>Model: Structured specialist request
    Model-->>Agent: Schema-constrained response
    Agent->>Agent: Validate or apply deterministic fallback
    Agent->>DB: Persist steps, message, artifact, and events
    API-->>UI: Result + tools + confidence + UI intents
    UI-->>User: Explainable response and reusable output
```

### Provider strategy

| Runtime | Provider | Purpose | Audit identifier |
|---|---|---|---|
| Production edge API | OpenAI Responses API | Structured text, high-detail vision, and image generation | `openai/<model>` |
| Production visual path | GPT Image 1.5 | Original private project visuals | `openai/gpt-image-1.5` |
| Canonical FastAPI | IBM watsonx.ai / Granite | IBM enterprise text and vision path | `ibm/granite-*` |
| Both runtimes | StoryOps deterministic rules | Resilient fallback and non-model analysis | `storyops/*` |

Production uses the reasoning model configured by `OPENAI_MODEL` and the visual
model configured by `OPENAI_IMAGE_MODEL`. Secrets stay in Cloudflare Worker
secret storage and never enter browser-visible variables.

---

## IBM Bob usage

IBM Bob was used as an SDLC partner across the complete project lifecycle, not
as a one-time code generator.

| Development activity | How Bob contributed | Repository evidence |
|---|---|---|
| Problem selection and brainstorming | Compared creative-industry problems, judged feasibility, and prioritized creative operations over another generation tool. | [`docs/research.md`](docs/research.md) |
| Project planning | Converted the product concept into milestones, dependencies, acceptance checks, and hour-sized tasks. | [`docs/implementation-plan.md`](docs/implementation-plan.md), [`docs/tasks.md`](docs/tasks.md) |
| System architecture | Designed the Next.js/FastAPI/Supabase boundaries, agent contract, provider separation, private asset flow, and V2 control plane. | [`docs/architecture.md`](docs/architecture.md), [`docs/storyops-v2-control-plane-architecture.md`](docs/storyops-v2-control-plane-architecture.md) |
| Code generation | Scaffolded models, schemas, routers, frontend pages, typed API clients, agent implementations, migrations, and deployment configuration. | `frontend/`, `backend/` |
| Debugging | Investigated auth redirects, API-contract drift, private asset delivery, provider failures, Cloudflare runtime behavior, CSP, and Windows build issues. | Tests, changelog, architecture failure notes |
| Refactoring | Centralized agent dispatch, isolated provider clients, extracted the V2 control-plane service, and aligned edge/FastAPI contracts. | `backend/app/agents/dispatcher.py`, `backend/app/services/`, `backend/cloudflare/src/control-plane.ts` |
| Documentation | Produced research, architecture, implementation, deployment, release, demo, and submission documentation from the working code. | `docs/`, `README.md` |
| Testing | Generated focused tests for authentication, ownership, storage, agents, demo seeding, API contracts, events, artifacts, fallback, and cursor pagination. | `backend/tests/`, `backend/cloudflare/src/index.test.ts`, `frontend/lib/navigation.test.ts` |
| UI improvements | Iterated from a basic landing page into an interactive architecture and capability experience, then added the AI Asset Studio and timeline. | `frontend/components/marketing/`, `frontend/components/control-plane/` |
| Developer productivity | Maintained project-specific rules, repeatable validation commands, explicit constraints, and implementation handoff notes. | `AGENTS.md`, `.bob/`, CI workflows |

Bob-specific guidance is stored under `.bob/` for planning, implementation, and
review modes. These artifacts document the intended workflow and constraints;
they are not vendor telemetry. The final challenge media pack should include
genuine Bob screenshots or exports where the submission rules require them.

---

## System architecture

### Runtime architecture

```mermaid
flowchart TB
    User([User / Creative Team])

    subgraph CF[Cloudflare Global Network]
        FE[Next.js 16 Frontend<br/>OpenNext Worker]
        API[TypeScript REST API Worker<br/>Auth · Validation · Control Plane]
        OBS[Workers Logs and Observability]
    end

    subgraph SB[Supabase]
        AUTH[Supabase Auth<br/>Email · JWT · Session]
        DB[(PostgreSQL<br/>Projects · Items · Analyses · Tasks<br/>Conversations · Runs · Artifacts · Events)]
        STORAGE[(Private Storage<br/>Signed Image Reads)]
        RT[Realtime-ready Event Projection<br/>Current UI refreshes after mutations]
    end

    subgraph AI[AI Processing]
        ROUTER[Specialist Router / Orchestrator]
        OPENAI[OpenAI Responses API<br/>Production Text + Vision]
        RULES[Deterministic StoryOps Rules<br/>Audited Fallback]
    end

    subgraph IBM[Canonical IBM Runtime]
        FASTAPI[FastAPI + SQLAlchemy]
        GRANITE[IBM watsonx.ai<br/>Granite Instruct + Vision]
    end

    User -->|HTTPS| FE
    FE -->|Register / Sign in| AUTH
    AUTH -->|Session + JWT| FE
    FE -->|Bearer JWT · Typed REST| API
    FE -->|Multipart file upload| API
    API -->|Validate JWT| AUTH
    API -->|Owned CRUD + event writes| DB
    API -->|Upload / signed URL| STORAGE
    API --> ROUTER
    ROUTER -->|Structured request| OPENAI
    OPENAI -->|Schema-constrained response| ROUTER
    ROUTER -->|Provider failure| RULES
    ROUTER -->|Analysis · tasks · run trace| DB
    DB -.->|Event timeline refresh| FE
    DB -. future realtime subscription .-> RT
    RT -.-> FE
    API --> OBS
    FE --> OBS

    FASTAPI --> DB
    FASTAPI --> STORAGE
    FASTAPI --> GRANITE
```

### Security boundary

```text
Browser-visible:
  Supabase project URL
  Supabase publishable key
  StoryOps API URL

Backend-only:
  Supabase secret key
  Database connection string
  OpenAI API key
  watsonx API key and project ID
```

The browser cannot access application tables directly. Backend runtimes verify
the Supabase identity, enforce project ownership, and use privileged credentials
only inside trusted server environments.

### V2 data model

```mermaid
erDiagram
    PROJECTS ||--o{ ITEMS : contains
    ITEMS ||--o{ ANALYSES : receives
    PROJECTS ||--o{ TASKS : owns
    ITEMS o|--o{ TASKS : links

    PROJECTS ||--o{ CONVERSATIONS : scopes
    CONVERSATIONS ||--o{ CONVERSATION_MESSAGES : contains
    PROJECTS ||--o{ WORKFLOW_RUNS : executes
    CONVERSATIONS o|--o{ WORKFLOW_RUNS : initiates
    WORKFLOW_RUNS ||--o{ WORKFLOW_STEPS : traces
    PROJECTS ||--o{ ARTIFACTS : owns
    CONVERSATIONS o|--o{ ARTIFACTS : produces
    PROJECTS ||--o{ WORKSPACE_EVENTS : records
    WORKFLOW_RUNS o|--o{ WORKSPACE_EVENTS : correlates
    ARTIFACTS o|--o{ WORKSPACE_EVENTS : emits
```

See [`docs/architecture.md`](docs/architecture.md) for component boundaries,
failure behavior, security controls, and provider details.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI |
| Production API | Cloudflare Workers, TypeScript, Supabase JS |
| Canonical API | FastAPI, Python 3.11, SQLAlchemy 2, Alembic |
| Authentication | Supabase Auth with SSR-compatible sessions |
| Database | Supabase PostgreSQL |
| File storage | Supabase private Storage with signed URLs |
| Production AI | OpenAI Responses API with structured text and vision output |
| IBM AI path | IBM watsonx.ai with Granite Instruct and Granite Vision |
| Resilience | Deterministic StoryOps analysis and control-plane fallbacks |
| Deployment | Cloudflare Workers + OpenNext; optional Docker/Render FastAPI path |
| CI/CD | GitHub Actions, Ruff, Pytest, Vitest, TypeScript, ESLint, Wrangler |
| SDLC partner | IBM Bob |

## Repository structure

```text
StoryOps-Studio/
├── .bob/                         # IBM Bob mode-specific guidance
├── .github/workflows/            # Backend and frontend CI
├── backend/
│   ├── app/
│   │   ├── agents/               # Granite and deterministic specialists
│   │   ├── models/               # SQLAlchemy domain/control-plane models
│   │   ├── routers/              # Versioned FastAPI endpoints
│   │   ├── schemas/              # Pydantic request/response contracts
│   │   └── services/             # Control-plane and event services
│   ├── cloudflare/
│   │   └── src/                  # Production Worker API and OpenAI path
│   ├── demo/                     # Judging fixtures
│   ├── migrations/               # Alembic schema history
│   └── tests/                    # Backend unit/integration tests
├── docs/
│   ├── assets/                   # README and submission media
│   ├── architecture.md
│   ├── storyops-v2-control-plane-architecture.md
│   ├── demo-walkthrough.md
│   ├── implementation-plan.md
│   ├── release-report.md
│   ├── research.md
│   └── tasks.md
├── frontend/
│   ├── app/                      # Next.js App Router pages
│   ├── components/
│   │   ├── control-plane/        # Console trace, artifacts, timeline
│   │   ├── marketing/            # Interactive public product experience
│   │   ├── pipeline/
│   │   └── ui/
│   ├── lib/                      # Typed API and environment boundaries
│   ├── types/
│   └── utils/supabase/
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
└── render.yaml
```

---

## Getting started

### Prerequisites

- Python 3.11
- Node.js 22.13 or newer
- npm
- A Supabase project
- Optional: IBM Cloud account with a watsonx.ai project and model entitlement
- Optional: Docker for canonical backend container validation
- Optional: Cloudflare account for production deployment

### 1. Clone the repository

```bash
git clone https://github.com/ukexe/Storyops_studio.git
cd Storyops_studio
```

### 2. Configure Supabase

1. Create a Supabase project.
2. Copy the project URL, publishable key, secret key, and session-pooler URL.
3. Add `http://localhost:3000/auth/confirm` to Auth redirect URLs.
4. Create `backend/.env` from the example.
5. Apply all Alembic migrations. They create the application tables, V2
   control-plane records, security constraints, and private `assets` bucket.

### 3. Configure environment variables

#### Canonical backend — `backend/.env`

Copy [`backend/.env.example`](backend/.env.example):

```dotenv
WATSONX_API_KEY=your-watsonx-api-key
WATSONX_PROJECT_ID=your-watsonx-project-id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json

DATABASE_URL=postgresql+asyncpg://postgres.project-ref:password@pooler-host:5432/postgres
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
ALLOW_ANONYMOUS_DEMO_SEED=false
```

#### Frontend — `frontend/.env.local`

Copy [`frontend/.env.local.example`](frontend/.env.local.example):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

These values are intentionally browser-visible. Never use `NEXT_PUBLIC_` for a
database password, Supabase secret key, OpenAI key, or watsonx key.

#### Edge API — `backend/cloudflare/.dev.vars`

Copy [`backend/cloudflare/.dev.vars.example`](backend/cloudflare/.dev.vars.example):

```dotenv
SUPABASE_SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

Non-secret Worker values live in
[`backend/cloudflare/wrangler.jsonc`](backend/cloudflare/wrangler.jsonc).

### 4. Start the canonical backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install, migrate, and run:

```bash
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

API: `http://localhost:8000`  
OpenAPI: `http://localhost:8000/docs`

### 5. Start the frontend

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Environment variable reference

| Variable | Runtime | Visibility | Required | Purpose |
|---|---|---:|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Public | Yes | Auth and signed asset host |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend | Public | Yes | Supabase browser authentication |
| `NEXT_PUBLIC_API_URL` | Frontend | Public | Yes | Versioned StoryOps REST API |
| `SUPABASE_URL` | APIs | Server | Yes | Supabase project endpoint |
| `SUPABASE_PUBLISHABLE_KEY` | FastAPI | Server | Yes | Canonical Supabase configuration |
| `SUPABASE_SECRET_KEY` | APIs | Secret | Yes | Privileged PostgREST and Storage access |
| `SUPABASE_JWKS_URL` | FastAPI | Server | Yes | JWT verification keys |
| `DATABASE_URL` | FastAPI/Alembic | Secret | Yes | PostgreSQL session-pooler connection |
| `OPENAI_API_KEY` | Edge API | Secret | Production | OpenAI Responses API |
| `OPENAI_MODEL` | Edge API | Server | Yes | Explicit production model selection |
| `OPENAI_IMAGE_MODEL` | Edge API | Server | Yes | Explicit image-generation model |
| `WATSONX_API_KEY` | FastAPI | Secret | Canonical path | IBM Cloud authentication |
| `WATSONX_PROJECT_ID` | FastAPI | Secret | Canonical path | watsonx.ai project |
| `WATSONX_URL` | FastAPI | Server | Yes | watsonx.ai regional endpoint |
| `CORS_ORIGINS` | APIs | Server | Yes | Exact allowed frontend origins |
| `ENVIRONMENT` | FastAPI | Server | Yes | Development, test, or production mode |
| `ALLOW_ANONYMOUS_DEMO_SEED` | FastAPI | Server | Yes | Must remain `false` in production |

---

## Testing and validation

### Canonical backend

```bash
cd backend
python -m pip_audit -r requirements.txt
python -m ruff check app tests migrations
python -m pytest tests -q -p no:cacheprovider
python -m alembic heads
python -m alembic upgrade head --sql
```

### Production edge API

```bash
cd backend/cloudflare
npm ci
npm audit --audit-level=moderate
npm test
npm run typecheck
npm run cf-typecheck
npm run dry-run
```

### Frontend

```bash
cd frontend
npm ci
npm audit --audit-level=moderate
npm run lint
npm test
npm run typecheck
npm run cf-typecheck
npm run build:worker
npm run dry-run
```

> On this Windows development host, Next.js can finish compilation and
> TypeScript validation before an upstream Turbopack process-cleanup
> `kill EPERM` error. GitHub Actions runs the production build on Linux, matching
> the Cloudflare/OpenNext release environment.

## Deployment

Deployment is intentionally ordered:

1. Apply the database migration.
2. Deploy and verify the API Worker.
3. Build and deploy the frontend Worker.
4. Run public and authenticated smoke tests.

See [`docs/deployment.md`](docs/deployment.md) for the complete runbook.

### Apply the Supabase schema

```bash
cd backend
python -m alembic heads
python -m alembic upgrade head
```

Current V2 head:

```text
73ff11ca1f26
```

### Deploy the Cloudflare API Worker

```bash
cd backend/cloudflare
npx wrangler whoami
npm ci
npm test
npm run typecheck
npm run cf-typecheck
npm run dry-run
npm run deploy
```

Required Worker secrets:

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put OPENAI_API_KEY
```

Health check:

```text
https://storyops-api.ukexe06.workers.dev/health
```

### Deploy the frontend Worker

```bash
cd frontend
npx wrangler whoami
npm ci
npm run lint
npm test
npm run typecheck
npm run cf-typecheck
npm run deploy
```

Live application:

```text
https://storyops.ukexe06.workers.dev
```

### Optional canonical FastAPI deployment

[`render.yaml`](render.yaml) defines a Docker-based Render service with:

- Pre-deploy Alembic migration
- `/health` readiness check
- Non-root container runtime
- Production secret declarations

Deploy this path only with valid IBM watsonx credentials.

---

## Screenshots

| Experience | Link |
|---|---|
| Interactive product architecture and capability explorer | [Open live homepage](https://storyops.ukexe06.workers.dev) |
| Authenticated creative pipeline | Sign in, seed the judging demo, and open the generated project |
| AI Asset Studio | Open **AI Asset Studio** inside a project |
| Replayable enterprise timeline | Open **Timeline** inside a project |

The release hero is stored under [`docs/assets/`](docs/assets/).

## Demo GIF / video

A public demo GIF or video URL is not yet committed. Until the final media
artifact is published, use the reproducible
[`docs/demo-walkthrough.md`](docs/demo-walkthrough.md) three-minute judging
script against the live deployment.

## Security

Please review [`SECURITY.md`](SECURITY.md) before reporting a vulnerability.

Key controls:

- No server secret is committed or browser-visible.
- Authenticated resources enforce project ownership.
- Browser roles cannot query application tables directly.
- Assets are private and served through expiring signed URLs.
- Creative content is bounded and treated as untrusted model data.
- OpenAI API storage is disabled.
- Provider failures are sanitized and explicitly audited.
- CI scans dependency vulnerabilities and Git history for secrets.

Do not include real credentials, tokens, private assets, or confidential
creative material in public issues.

## Documentation

- [System architecture](docs/architecture.md)
- [StoryOps Studio V2 architecture](docs/storyops-v2-control-plane-architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Task and release gates](docs/tasks.md)
- [Demo walkthrough](docs/demo-walkthrough.md)
- [Engineering release report](docs/release-report.md)
- [Product and competition research](docs/research.md)
- [Deployment runbook](docs/deployment.md)
- [Contributing guide](CONTRIBUTING.md)

## Roadmap

### Next

- Durable global quotas and cost controls
- Pagination and batched edge reads
- Automated browser E2E tests
- Organization membership, RBAC, assignments, comments, and approvals
- Durable pause/resume/retry execution through an agent/workflow runtime

### Intelligence fabric

- Versioned source records and evidence-addressable chunks
- Embedding pipeline and authorized semantic search
- Pattern candidates, duplicate detection, and similarity clustering
- Persistent project knowledge map
- Sandboxed repository generation
- Impact observations, assumptions, forecasts, and sensitivity analysis

Roadmap items are not presented as live features until their storage,
execution, security, tests, and UI are complete.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and
open an issue before proposing a large architecture or provider change.

## Contributors

- [ukexe](https://github.com/ukexe) — creator and maintainer

IBM Bob served as the primary AI SDLC partner for planning, implementation,
testing, debugging, hardening, and documentation.

## License

StoryOps Studio is released under the [MIT License](LICENSE).

---

<div align="center">

**StoryOps Studio · AI Creative Operations**

Creative evidence → explainable intelligence → accountable action

[Live application](https://storyops.ukexe06.workers.dev) ·
[Architecture](docs/architecture.md) ·
[Demo](docs/demo-walkthrough.md) ·
[Report an issue](https://github.com/ukexe/Storyops_studio/issues)

</div>
