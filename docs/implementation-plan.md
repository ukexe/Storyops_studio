# StoryOps Studio — Implementation Plan

> **Source document:** `docs/research.md`
> **Goal:** Build a competition-grade MVP of StoryOps Studio for the IBM AI Builders Challenge (July 2026, *Reimagine Creative Industries with AI*).

---

## Top-Level Overview

StoryOps Studio is an agentic AI platform that turns fragmented creative production workflows into a unified, insight-driven pipeline. Users bring briefs, scripts, and asset files into a **Kanban pipeline view** (Idea → Script → Assets → Edit → Feedback → Publish → Analyze). Specialized IBM Granite agents analyze each item and emit structured recommendations and auto-generated tasks.

**Judging criteria and how the MVP directly addresses each:**

| Criterion | How MVP addresses it |
|---|---|
| Innovation | Multi-agent creative ops platform, not just an asset generator |
| Challenge Fit | Directly reimagines creative team workflows end-to-end |
| Technical Execution | FastAPI + Next.js + Granite via watsonx.ai, fully deployed |
| Real-world Impact | Briefs, scripts, thumbnails analyzed with actionable tasks |
| IBM Ecosystem Alignment | Bob as SDLC partner, Granite for reasoning and vision |
| Demo WOW Factor | One-click demo seed loads a full project with AI insights |

**MVP scope:**
- Monorepo: Next.js frontend + FastAPI backend + Supabase Postgres
- Three Granite agents (Brief, Script, Asset) + deterministic Edit, Performance, and Feedback agents
- Kanban pipeline UI, item detail + analysis panel, AI task board
- One-click demo seed for judges
- README + `docs/architecture.md` evidencing IBM Bob usage across SDLC

**Explicitly cut to protect timeline:**
- Async job queue (analysis and generated-task persistence are synchronous)
- `stages` database table (stages are constants in code, not rows)
- `public.users` profile table (user identity read from Supabase JWT claims)
- Separate `services/` layer (logic lives in routers; extracted only when shared)
- Soft deletes (hard delete throughout)
- 80%+ test coverage goal (tests focus on agent output parsing and stage-seeding only)
- Drag-and-drop on task board (button-based status change is sufficient)
- Secret editing in the UI (the read-only Settings page reports service and
  analysis status; deployment platforms own credentials)

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) | Cloudflare Workers via OpenNext |
| UI Components | shadcn/ui + Tailwind CSS | Polished demo look with minimal setup |
| Backend | FastAPI (Python 3.11) | Native `ibm-watsonx-ai` SDK; auto OpenAPI docs |
| ORM | SQLAlchemy 2.0 (async) + Alembic | Type-safe, migration-managed |
| Database | Supabase (PostgreSQL) | Free tier, Auth + Storage included |
| Auth | Supabase Auth (JWT) | Publishable key on frontend; secret key on backend |
| AI Models | IBM Granite via watsonx.ai | `granite-3-8b-instruct` for text; Granite Vision for images |
| File Storage | Supabase Storage | Asset uploads (thumbnails, script PDFs) |
| CI/CD | GitHub Actions | Lint + type-check on push; no auto-deploy needed for hackathon |
| Frontend Deploy | Cloudflare Workers | OpenNext + Wrangler |
| Backend Deploy | Cloudflare Worker live adapter + Render Blueprint | Edge REST contract now; Python/Granite runtime when credentials and host are available |

---

## Folder Structure

```
storyops-studio/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx          # project list + health badge
│   │   ├── projects/[id]/
│   │   │   ├── page.tsx                # pipeline kanban
│   │   │   ├── items/[itemId]/page.tsx # item detail + analysis panel
│   │   │   └── tasks/page.tsx          # AI task board
│   │   └── layout.tsx
│   ├── components/
│   │   ├── pipeline/
│   │   │   ├── PipelineBoard.tsx
│   │   │   ├── StageColumn.tsx
│   │   │   └── ItemCard.tsx
│   │   ├── items/
│   │   │   └── AnalysisPanel.tsx
│   │   ├── tasks/TaskCard.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       └── WatsonxStatusBadge.tsx  # shown on dashboard
│   ├── lib/
│   │   ├── api.ts                      # typed fetch wrapper (injects auth header)
│   │   └── supabase/                    # browser, server, and Proxy clients
│   ├── types/index.ts                  # TS types mirroring backend Pydantic schemas
│   ├── .env.local.example
│   ├── next.config.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # app factory, CORS, lifespan startup check
│   │   ├── config.py                   # pydantic-settings; fails fast if vars missing
│   │   ├── database.py                 # async SQLAlchemy engine + get_db dependency
│   │   ├── auth.py                     # JWT decode dependency (reads Supabase JWKS)
│   │   ├── constants.py                # PIPELINE_STAGES = ["Idea","Script",...] ordered list
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   ├── item.py
│   │   │   ├── analysis.py
│   │   │   └── task.py
│   │   ├── schemas/
│   │   │   ├── project.py
│   │   │   ├── item.py
│   │   │   ├── analysis.py
│   │   │   └── task.py
│   │   ├── routers/
│   │   │   ├── projects.py             # includes stage-seeding on POST /projects
│   │   │   ├── items.py
│   │   │   ├── analyses.py             # POST /{id}/analyze triggers dispatcher
│   │   │   ├── tasks.py
│   │   │   └── demo.py                 # POST /demo/seed — loads sample project
│   │   └── agents/
│   │       ├── base_agent.py           # AgentBase abstract class
│   │       ├── brief_agent.py
│   │       ├── script_agent.py
│   │       ├── asset_agent.py
│   │       ├── edit_agent.py
│   │       ├── performance_agent.py
│   │       ├── feedback_agent.py
│   │       ├── dispatcher.py           # AGENT_MAP; single routing source of truth
│   │       └── watsonx_client.py       # ibm_watsonx_ai SDK wrapper
│   ├── migrations/
│   │   ├── env.py
│   │   └── versions/
│   ├── tests/
│   │   ├── test_agents.py              # mocked watsonx; tests output parsing
│   │   └── test_stage_seeding.py       # verifies project creation seeds 7 stages
│   ├── demo/
│   │   ├── sample-brief.txt
│   │   ├── sample-script.txt
│   │   └── sample-thumbnail.jpg
│   ├── .env.example
│   ├── requirements.txt
│   ├── requirements-dev.txt            # pytest, httpx, ruff
│   └── alembic.ini
│
├── .github/workflows/
│   ├── backend-ci.yml                  # ruff + pytest on push
│   └── frontend-ci.yml                 # eslint + tsc --noEmit on push
│
├── docs/
│   ├── research.md
│   ├── implementation-plan.md
│   └── architecture.md                 # written in Milestone 5; Bob SDLC artifact
│
├── AGENTS.md
├── README.md
└── .gitignore
```

---

## Database Schema

Supabase Auth owns identity. The app has **4 tables** (no `users` profile table; no `stages` table).

```sql
-- public.projects
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
owner_id     uuid NOT NULL          -- from Supabase JWT sub claim; no FK needed
name         text NOT NULL
description  text
repo_url     text
demo_version varchar(50)       -- nullable; unique per owner when set
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()

-- public.items
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE
stage        text NOT NULL          -- one of PIPELINE_STAGES constant; validated in app layer
type         text NOT NULL          -- 'brief'|'script'|'asset'|'edit'|'feedback'|'metric'
title        text NOT NULL
content      text                   -- text items (briefs, scripts)
file_url     text                   -- Supabase Storage URL for binary uploads
metadata     jsonb NOT NULL DEFAULT '{}'
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()

-- public.analyses
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
item_id      uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE
agent_type   text NOT NULL
summary      text NOT NULL
recommendations  jsonb NOT NULL     -- array of {title, detail, priority: 'low'|'medium'|'high'}
score_metrics    jsonb NOT NULL DEFAULT '{}'
model_id     text NOT NULL          -- Granite model ID used (audit trail for judges)
created_at   timestamptz DEFAULT now()

-- public.tasks
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE
linked_item_id  uuid REFERENCES public.items(id) ON DELETE SET NULL
title        text NOT NULL
description  text
status       text NOT NULL DEFAULT 'todo'    -- 'todo'|'in_progress'|'done'
priority     text NOT NULL DEFAULT 'medium'  -- 'low'|'medium'|'high'
created_at   timestamptz DEFAULT now()
updated_at   timestamptz DEFAULT now()
```

**Indexes:**
- `items(project_id)`, `items(stage)` — pipeline board load
- `analyses(item_id)` — item detail fetch
- `tasks(project_id, status)` — task board filter

**Pipeline stages as a code constant** (`backend/app/constants.py`):
```python
PIPELINE_STAGES = ["Idea", "Script", "Assets", "Edit", "Feedback", "Publish", "Analyze"]
```
On `POST /projects`, the backend stores these as a JSON array in `projects.stages_metadata` — or simply derives column data on read — no separate table required.

---

## API Endpoints

Base URL: `/api/v1`

All application endpoints, including demo seeding, require a valid Supabase JWT. `GET /live` and `GET /health` are public probes.

### Projects
| Method | Path | Description |
|---|---|---|
| GET | `/projects` | List caller's projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Project + item counts per stage |
| PATCH | `/projects/{id}` | Update name / description / repo_url |
| DELETE | `/projects/{id}` | Delete project (hard) |

### Items
| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/items` | All items grouped by stage |
| POST | `/projects/{id}/items` | Create item (multipart for file, JSON for text) |
| GET | `/items/{id}` | Item + latest analysis |
| PATCH | `/items/{id}` | Update content / metadata / stage |
| DELETE | `/items/{id}` | Delete item (hard) |

### Analyses
| Method | Path | Description |
|---|---|---|
| POST | `/items/{id}/analyze` | Run agent synchronously; return analysis immediately |
| GET | `/items/{id}/analyses` | All analyses for an item (most recent first) |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/projects/{id}/tasks` | List tasks; `?status=todo` filter supported |
| PATCH | `/tasks/{id}` | Update status / priority |
| DELETE | `/tasks/{id}` | Delete task |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{status: "ok", watsonx: "connected"\|"error"}` |
| POST | `/demo/seed` | Creates a demo project with pre-loaded items and runs all agents; returns project_id |

> **Why synchronous analysis:** No job queue exists. `POST /items/{id}/analyze` calls the selected agent, persists the analysis and generated tasks atomically, and returns the full response. The frontend shows a loading state; no polling is needed.

---

## AI Agents

All agents implement `AgentBase` with `async analyze(item) -> AnalysisResult`. The `dispatcher.py` `AGENT_MAP` is the **only** place where item type maps to an agent.

```python
# dispatcher.py
AGENT_MAP: dict[str, type[AgentBase]] = {
    "brief":       BriefAgent,
    "script":      ScriptAgent,
    "asset":       AssetAgent,
    "edit":        EditAgent,
    "feedback":    FeedbackAgent,
    "metric":      PerformanceAgent,
}
```

### watsonx Client (`watsonx_client.py`)
- Wraps `ibm_watsonx_ai.ModelInference`
- Instantiated once as a module-level singleton; injected into agents via constructor
- `generate_text(model_id, prompt, max_tokens)` — returns raw string
- `analyze_image(model_id, image_bytes, prompt)` — base64-encodes the bytes and returns raw text
- On startup (`main.py` lifespan), calls `GET /health` against watsonx to verify connectivity; logs warning but does not crash if unavailable (allows offline dev)

### Brief Agent
- **Model:** `ibm/granite-3-8b-instruct`
- **Prompt:** System prompt establishes StoryOps Studio context. User prompt sends brief text and requests a JSON object: `{objectives: string[], constraints: string[], missing_info: string[], clarity_score: number}`
- **Output parsing:** `json.loads()` on the model response; falls back to extracting the first JSON block if the model wraps it in markdown
- **Tasks emitted:** One task per `missing_info` item (priority: medium)

### Script Agent
- **Model:** `ibm/granite-3-8b-instruct`
- **Prompt:** Sends script text + `content_type` from `item.metadata`. Requests: `{hook_strength: number, pacing_notes: string[], cta_present: bool, retention_risk: "low"|"medium"|"high", improvements: [{title, detail}]}`
- **Tasks emitted:** Up to 3 tasks from `improvements` (priority mapped from `retention_risk`)

### Asset Agent
- **Model:** Granite Vision variant available in watsonx.ai at time of implementation
- **Input:** Fetches image bytes from `item.file_url`; `WatsonxClient` performs the base64 encoding for the vision API
- **Prompt:** Requests: `{brand_consistency: number, logo_integrity: "pass"|"flag"|"fail", issues: [{element, description, severity: "low"|"medium"|"high"}]}`
- **Tasks emitted:** One task per issue with severity `medium` or `high`

### Edit Agent
- Validates `item.metadata.scenes` entries and analyzes scene count, average duration, longest duration, and pacing risks.

### Performance Agent
- Validates `{views, avg_retention_pct, ctr_pct}` and emits retention and packaging recommendations.

### Feedback Agent
- Extracts actionable review notes into structured recommendations and tasks.

---

## Frontend Pages & Components

### Dashboard (`/dashboard`)
- Project cards: name, description, item count, last-updated
- `WatsonxStatusBadge` — calls `GET /health`; shows green "Connected" or amber "Watsonx unavailable"
- "New Project" modal; "Seed Demo" button calls `POST /demo/seed` and navigates to the new project

### Pipeline View (`/projects/[id]`)
- Horizontal scroll kanban with 7 fixed columns derived from `PIPELINE_STAGES` constant (not fetched from API)
- `ItemCard`: title, type badge, analysis indicator (dot: grey=none, yellow=analyzing, green=done, red=has open tasks)
- "Add Item" slide-over: title, type selector, text area **or** file picker (not both simultaneously — type determines which)
- Items fetched once on load via `GET /projects/{id}/items`; optimistic insert on "Add Item" submit

### Item Detail (`/projects/[id]/items/[itemId]`)
- Left: content display (text pre-formatted, or image preview for assets)
- Right: `AnalysisPanel` — summary, score metric badges, recommendations list with priority colours
- "Analyze" button → `POST /items/{id}/analyze` → loading state → result rendered; no polling
- "Back to Pipeline" breadcrumb

### Task Board (`/projects/[id]/tasks`)
- Three columns: Todo / In Progress / Done
- `TaskCard`: title, priority badge, linked item name as a link back to item detail
- Status change via button on card (no drag-and-drop)

---

## Demo Seed (`POST /demo/seed`)

This is the single highest-impact feature for judging. One button loads a complete, pre-analyzed project.

**What it does:**
1. Creates project: "YouTube Series — AI Explained"
2. Creates 4 items with real content from `backend/demo/` files:
   - Stage "Script": `sample-brief.txt` (type: brief)
   - Stage "Script": `sample-script.txt` (type: script)
   - Stage "Assets": `sample-thumbnail.jpg` (type: asset)
   - Stage "Feedback": a hardcoded feedback note (type: feedback)
3. Runs Brief Agent + Script Agent + Asset Agent against those items
4. Persists all analyses and auto-created tasks
5. Returns `{project_id}` — frontend navigates directly to the pipeline view

The demo data in `backend/demo/` must be compelling:
- `sample-brief.txt`: realistic YouTube video brief with intentional gaps (triggers missing_info tasks)
- `sample-script.txt`: a YouTube-style script with a weak hook and missing CTA (triggers script improvements)
- `sample-thumbnail.jpg`: a thumbnail with a detectable brand issue (triggers asset tasks)

---

## Milestones

### Milestone 1 — Backend Foundation
**Intent:** Get the FastAPI backend running with the database schema, auth middleware, and all CRUD endpoints working — no AI yet. This is the load-bearing foundation everything else sits on.

**Expected Outcomes:**
- `uvicorn app.main:app` starts and passes `GET /health`
- All CRUD endpoints return correct JSON shapes (verified with pytest)
- Project creation validated with two focused tests
- Supabase JWT middleware rejects unauthenticated requests

**Todo List:**
- [x] Create `backend/` structure: `main.py`, `config.py`, `database.py`, `auth.py`, `constants.py`
- [x] Add fail-fast pydantic-settings configuration
- [x] Write SQLAlchemy models for `projects`, `items`, `analyses`, `tasks`
- [x] Write Alembic schema and security migrations
- [x] Implement Supabase JWT/JWKS authentication
- [x] Implement project CRUD and ownership checks
- [x] Implement JSON/multipart item CRUD and ownership checks
- [x] Implement task listing, filtering, updates, and deletion
- [x] Implement analysis listing and invocation
- [x] Implement liveness and readiness endpoints
- [x] Write focused API, ownership, auth, agent, storage, and demo tests
- [x] Create `backend/.env.example` with all required configuration

**Relevant Context:** Schema section above; `constants.py` holds `PIPELINE_STAGES`; `stage` column on `items` is a text field validated against `PIPELINE_STAGES` in the Pydantic schema

**Status:** [x] complete locally and applied to production through revision `b91f4d8a2c10`

---

### Milestone 2 — AI Agents + Analysis Endpoint + Demo Seed
**Intent:** Integrate IBM Granite, implement the three production agents, wire the analysis endpoint, and build the demo seed. This is the project's core differentiator — it must work before touching the frontend.

**Expected Outcomes:**
- `POST /items/{id}/analyze` returns a full `AnalysisResult` for brief, script, and asset items
- Analysis and auto-created tasks are persisted and retrievable
- `POST /demo/seed` creates a fully-analyzed project end-to-end in one call
- `GET /health` reports watsonx connectivity status
- Agent output parsing handles malformed JSON gracefully (fallback to extracting JSON block)

**Todo List:**
- [x] Implement `watsonx_client.py`: `generate_text`, `analyze_image`; module-level singleton; startup connectivity check
- [x] Implement `base_agent.py` abstract class with `AnalysisResult` dataclass
- [x] Implement `brief_agent.py`: prompt, `json.loads` parser, fallback parser, task emission logic
- [x] Implement `script_agent.py`: prompt with `content_type` context, parser, task emission
- [x] Implement `asset_agent.py`: image download, Granite Vision call, parser, task emission
- [x] Implement Edit, Performance, and Feedback rules agents
- [x] Implement `dispatcher.py` `AGENT_MAP` and `dispatch(item, db)` — persists analysis + creates tasks
- [x] Wire `POST /items/{id}/analyze` in `analyses.py` to call `dispatcher.dispatch()`
- [x] Create `backend/demo/` folder with `sample-brief.txt`, `sample-script.txt`, `sample-thumbnail.jpg`
- [x] Implement `routers/demo.py`: `POST /demo/seed` — creates project, items, runs agents, returns `project_id`
- [x] Write `tests/test_agents.py`: mock watsonx responses; test JSON parsing + fallback; test task count from known outputs

**Relevant Context:** Agent section above; `AGENTS.md` rules — Granite model IDs must be fully qualified; `analyze_image` needs base64 encoding not URL passing; `analyses.recommendations` is always a JSON array

**Status:** [x] complete

---

### Milestone 3 — Frontend Foundation + Pipeline View
**Intent:** Build the Next.js app from auth through the pipeline kanban, connected to the live backend.

**Expected Outcomes:**
- Users can log in and see their project dashboard
- Pipeline kanban renders 7 columns with items from the backend
- "Add Item" works for both text and file types
- "Seed Demo" button on dashboard creates and navigates to a fully-analyzed project
- `WatsonxStatusBadge` shows live watsonx connectivity

**Todo List:**
- [x] Create `frontend/` with `npx create-next-app` (TypeScript, App Router, Tailwind, ESLint)
- [x] Install shadcn/ui; add the primitives required by auth, dashboard, and pipeline views
- [x] Implement environment-specific Supabase clients and the typed `lib/api.ts` fetch wrapper
- [x] Define `types/index.ts`: `Project`, `Item`, `Analysis`, `Task`, `Recommendation`, and shared enums/constants
- [x] Build login, registration, email confirmation, and protected-route flows with Supabase Auth
- [x] Build `Dashboard` page: project cards, "New Project" dialog, "Seed Demo" button, and `WatsonxStatusBadge`
- [x] Build `Header` shared component with user identity, navigation, and sign-out
- [x] Build `PipelineBoard`: renders 7 columns from `PIPELINE_STAGES` constant
- [x] Build `StageColumn` + `ItemCard` (title, type badge, analysis indicator)
- [x] Build "Add Item" Sheet: type selector switches between textarea and image upload
- [x] Connect all pipeline API calls; handle loading, retry, error, and expired-session states

**Relevant Context:** `PIPELINE_STAGES` is a frontend constant too — do not fetch stages from backend; `types/index.ts` must exactly mirror backend Pydantic response schemas

**Status:** [x] complete

---

### Milestone 4 — Item Detail, Analysis Panel, Task Board
**Intent:** Complete the UI so users can trigger analysis, see AI insights, and manage generated tasks.

**Expected Outcomes:**
- Clicking an ItemCard navigates to item detail showing content + AnalysisPanel
- "Analyze" button triggers analysis and renders result without page reload
- Recommendations list shows priority colour-coding and actionable text
- Score metric badges (hook_strength, clarity_score, etc.) visible at a glance
- Task board shows all project tasks with status change working

**Todo List:**
- [x] Build `ItemDetail` page: responsive text/image content panel and analysis sidebar
- [x] Build `AnalysisPanel`: summary, heterogeneous score metric badges, recommendations list, and empty states
- [x] Implement "Analyze" button: synchronous API call, loading state, errors, and result replacement
- [x] Build `TaskBoard` page: three responsive columns and accessible task status controls
- [x] Add breadcrumb navigation across Dashboard, Project Pipeline, Item Detail, and Task Board

**Relevant Context:** Analysis is synchronous — `POST /analyze` returns the full result; no polling loop needed; `recommendations` JSON array drives the list rendering

**Status:** [x] complete

---

### Milestone 5 — Documentation, Architecture, and Demo Prep
**Intent:** Produce the repo artifacts that judges score alongside the demo video. This is the second-highest-impact milestone after the AI agents themselves.

**Expected Outcomes:**
- `README.md` is judge-ready: setup works from a fresh clone in under 10 minutes
- `docs/architecture.md` documents components, data flow, and agent dispatch
- IBM Bob usage is explicitly evidenced in commit history references and architecture doc
- Demo walkthrough in `docs/demo-walkthrough.md` matches the 6-step script from `research.md`
- CI passes on main branch

**Todo List:**
- [x] Write release-ready root `README.md`
- [x] Write `docs/architecture.md` with system, schema, agent, deployment, security, and IBM Bob details
- [x] Write `docs/demo-walkthrough.md` with acceptance checks
- [x] Add validated frontend and backend GitHub Actions workflows
- [x] Verify full demo flow against deployed Cloudflare frontend and REST adapter
- [x] Prepare the local `v1.0.0` release commit and annotated tag
- [x] Push the release tag to GitHub
- [x] Publish the v1.1.0 GitHub Release
- [ ] Add the public demo video URL

**Relevant Context:** `docs/research.md` → IBM Bob Usage Strategy, Demo Script, Judging Strategy, README Structure; IBM Bob evidence is a judging criterion per `AGENTS.md`

**Status:** production flow verified; public release publication and real IBM credentials remain external gates

---

## Environment Variables

### Backend (`backend/.env`)
```
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
DATABASE_URL=postgresql+asyncpg://...   # Supabase session pooler, port 5432
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
ALLOW_ANONYMOUS_DEMO_SEED=false
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Key Constraints & Gotchas

1. **`stage` on `items` is a validated string, not a FK** — validated against `PIPELINE_STAGES` constant in the Pydantic schema. Never stored as a row in a `stages` table.
2. **Analysis is synchronous** — `POST /items/{id}/analyze` blocks until Granite responds (3–8s). Frontend shows a spinner; no polling or job IDs.
3. **`analyses.recommendations` must be a JSON array** — always `[{title, detail, priority}]`. The frontend renders from this structure; plain text will break the UI.
4. **Granite model IDs must be fully qualified** — e.g., `ibm/granite-3-8b-instruct`. Never use short aliases.
5. **Use the Supabase session pooler on port 5432** — the canonical FastAPI
   deployment uses the least-privilege `storyops_app` runtime role; the live
   edge adapter uses Supabase REST instead of a database password.
6. **IBM Bob usage must be visibly evidenced** — reference Bob's role in planning, scaffolding, and docs in `docs/architecture.md` and README. This is a judging criterion.
7. **Demo seed is authenticated and idempotent** — the live adapter records
   explicit edge-rules IDs. Deploy the canonical FastAPI service with valid
   `WATSONX_*` values to demonstrate real Granite inference.
8. **Asset Agent requires image bytes, not a URL** — `AssetAgent` fetches the image from Supabase Storage and `watsonx_client.analyze_image()` base64-encodes it before calling the Granite Vision API.
