# StoryOps Studio — Task Breakdown

> Derived from `docs/implementation-plan.md`.
> Each task is scoped to ~1 hour of focused work.
> Tasks within a phase are ordered by dependency. Complete them in order unless marked **parallel-safe**.

---

## Phase 1 — Backend Skeleton

> Goal: a runnable FastAPI server with database connectivity and auth. No features yet — just the wiring that everything else depends on.

---

### T1.1 — Repo scaffold and environment setup
**What:** Create the monorepo root and both service directories with their dependency files and example env files. Establish the baseline before touching any Python.

**Deliverable:** Running `uvicorn app.main:app` from `backend/` starts a server (even if it returns 404 on all routes). Running `next dev` from `frontend/` starts the dev server.

**Steps:**
- [x] Create root `.gitignore` (Python + Node patterns)
- [x] Create `backend/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic-settings`, `python-multipart`, `httpx`
- [x] Create `backend/requirements-dev.txt` with: `pytest`, `pytest-asyncio`, `ruff`
- [x] Create `backend/app/main.py` — minimal FastAPI app, CORS middleware (allow all origins for dev), single `GET /` returning `{"hello": "storyops"}`
- [x] Create fail-fast backend settings for watsonx, database, Supabase publishable/secret keys, and JWKS
- [x] Create `backend/.env.example` with all six var names and empty values
- [x] Create `frontend/` by running `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
- [x] Verify both services start without errors

**Constraints:** `config.py` must raise a clear `ValueError` on startup if any required var is missing — not a runtime error later.

---

### T1.2 — Database connection and ORM base
**What:** Wire SQLAlchemy async engine to Supabase Postgres and create the `DeclarativeBase` all models will use.

**Deliverable:** `database.py` exports a working `AsyncSession` dependency. A simple `python -c "from app.database import engine"` runs without error when `DATABASE_URL` is set.

**Steps:**
- [x] Create `backend/app/database.py`:
  - `engine = create_async_engine(settings.DATABASE_URL, echo=False)`
  - `AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)`
  - `async def get_db()` FastAPI dependency yielding a session
- [x] Create `backend/app/models/__init__.py` importing all models (empty for now)
- [x] Create `backend/app/constants.py`:
  ```python
  PIPELINE_STAGES = ["Idea", "Script", "Assets", "Edit", "Feedback", "Publish", "Analyze"]
  ITEM_TYPES = ["brief", "script", "asset", "edit", "feedback", "metric"]
  ```
- [x] Add a `lifespan` context manager to `main.py` that runs a `SELECT 1` on startup to verify DB connectivity; log result at INFO level

**Constraints:** Use the `postgresql+asyncpg://` Supabase session-pooler connection string on port 5432 for the persistent backend service.

---

### T1.3 — SQLAlchemy ORM models
**What:** Define the four database models. No migration yet — just the Python classes.

**Deliverable:** All four model files exist and import without error. `python -c "from app.models import Project, Item, Analysis, Task"` succeeds.

**Steps:**
- [x] Create `backend/app/models/base.py` — `Base = DeclarativeBase()` and `TimestampMixin` with `created_at`, `updated_at` columns
- [x] Create `backend/app/models/project.py` — `Project` with `id` (uuid pk), `owner_id` (uuid, not null, no FK), `name`, `description`, `repo_url`, `created_at`, `updated_at`
- [x] Create `backend/app/models/item.py` — `Item` with `id`, `project_id` (FK → projects), `stage` (text), `type` (text), `title`, `content`, `file_url`, `metadata` (JSON), `created_at`, `updated_at`
- [x] Create `backend/app/models/analysis.py` — `Analysis` with `id`, `item_id` (FK → items), `agent_type`, `summary`, `recommendations` (JSON), `score_metrics` (JSON), `model_id`, `created_at`
- [x] Create `backend/app/models/task.py` — `Task` with `id`, `project_id` (FK → projects), `linked_item_id` (FK → items, nullable), `title`, `description`, `status` (default `'todo'`), `priority` (default `'medium'`), `created_at`, `updated_at`
- [x] Update `backend/app/models/__init__.py` to export all four

**Constraints:** Use `mapped_column` / `Mapped` syntax (SQLAlchemy 2.0 style). All PKs default to `uuid.uuid4` via `default=uuid.uuid4`. The `metadata` and JSON columns use `type_=JSON` from `sqlalchemy`.

---

### T1.4 — Alembic migration
**What:** Generate and run the initial database migration creating all four tables and their indexes.

**Deliverable:** `alembic upgrade head` runs without error against Supabase. All four tables exist in the database.

**Steps:**
- [x] Run `alembic init migrations` inside `backend/`
- [x] Edit `migrations/env.py`: import `Base` from `app.models`, set `target_metadata = Base.metadata`, configure async engine using `settings.DATABASE_URL`
- [x] Edit `alembic.ini`: set `sqlalchemy.url` to a placeholder (actual URL read from env in `env.py`)
- [x] Run `alembic revision --autogenerate -m "initial schema"` and inspect the generated file
- [x] Manually add the three indexes to the migration: `ix_items_project_id`, `ix_items_stage`, `ix_analyses_item_id`, `ix_tasks_project_status` (compound)
- [x] Run `alembic upgrade head` against Supabase and verify tables, indexes,
  constraints, RLS, UUID defaults, triggers, revision state, and private Storage

**Constraints:** Alembic async migration requires `run_migrations_online` to use `AsyncEngine.begin()`. Follow the async pattern from Alembic docs — the default sync template will fail with asyncpg.

---

### T1.5 — Supabase JWT auth dependency
**What:** Implement a FastAPI dependency that decodes Supabase JWTs and extracts `user_id`. All protected routes will use this.

**Deliverable:** A `get_current_user` dependency that returns `{"user_id": "<uuid>"}` on a valid token and raises `HTTP 401` on invalid/missing tokens.

**Steps:**
- [x] Add `python-jose[cryptography]` to `requirements.txt`
- [x] Create `backend/app/auth.py`:
  - `get_current_user(token: str = Depends(oauth2_scheme)) -> dict` dependency
  - Fetch Supabase JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cache the result in a module-level variable on first call)
  - Decode JWT using `jose.jwt.decode()` with the JWKS public key, audience `"authenticated"`
  - Return `{"user_id": payload["sub"]}`
  - Raise `HTTPException(status_code=401)` on any decode error
- [x] Add a test route to `main.py`: `GET /auth-test` protected by `get_current_user`, returns `{"user_id": user["user_id"]}` — remove after T1.6 tests pass

**Constraints:** Do not implement `/auth/login` or `/auth/register` — Supabase Auth handles token issuance entirely on the client side. The backend only validates tokens it receives.

---

### T1.6 — Projects router
**What:** Implement all five project endpoints. This is the first real feature route.

**Deliverable:** All five endpoints return correct shapes. `GET /api/v1/projects` returns `[]` for a new user. `POST /api/v1/projects` creates and returns a project.

**Steps:**
- [x] Create `backend/app/schemas/project.py` — `ProjectCreate` (name, description?, repo_url?), `ProjectResponse` (all fields + `item_counts: dict[str, int]`)
- [x] Create `backend/app/routers/projects.py` with router prefix `/projects`:
  - `GET /` — query projects where `owner_id == user_id`, return list
  - `POST /` — insert project with `owner_id = user_id`; return `ProjectResponse`
  - `GET /{id}` — fetch project + count items per stage via a group-by query; return `ProjectResponse`
  - `PATCH /{id}` — update name/description/repo_url (only fields provided); verify `owner_id` matches
  - `DELETE /{id}` — hard delete; verify `owner_id` matches; return `204`
- [x] Mount router in `main.py` under `/api/v1`
- [x] Remove the `GET /auth-test` test route added in T1.5

**Constraints:** `owner_id` check must be on every mutating endpoint — return `404` (not `403`) if a project exists but belongs to another user, to avoid leaking existence.

---

### T1.7 — Items router
**What:** Implement the five item endpoints, including both text (JSON body) and file upload (multipart) creation paths.

**Deliverable:** `POST /api/v1/projects/{id}/items` with a JSON body creates a text item. The same endpoint with a multipart form creates an item with a `file_url`. `GET /api/v1/projects/{id}/items` returns items grouped by stage as `dict[str, list[ItemResponse]]`.

**Steps:**
- [x] Create `backend/app/schemas/item.py` — `ItemCreate` (stage, type, title, content?, metadata?), `ItemResponse` (all fields + `latest_analysis: AnalysisResponse | None`)
- [x] Create `backend/app/routers/items.py` with router prefix `/`:
  - `GET /projects/{id}/items` — fetch all items for project; group by `stage`; eager-load latest analysis per item via subquery
  - `POST /projects/{id}/items` — accept both `application/json` and `multipart/form-data`; for file uploads, store file in Supabase Storage bucket `assets/{project_id}/{filename}` using `supabase-py` service role client; set `file_url`; validate `stage` against `PIPELINE_STAGES`, `type` against `ITEM_TYPES`
  - `GET /items/{id}` — fetch item with latest analysis
  - `PATCH /items/{id}` — partial update; validate `stage` if provided
  - `DELETE /items/{id}` — hard delete; verify project ownership via join
- [x] Add `supabase` (Python SDK) to `requirements.txt`; instantiate service role client in `config.py` or a separate `storage.py`

**Constraints:** Item `stage` and `type` must be validated against constants — return `422` with a descriptive message if invalid. Do not accept unknown values silently.

---

### T1.8 — Tasks and analyses read routers
**What:** Implement the tasks CRUD endpoints and the read-only analyses endpoint. The `POST /analyze` write endpoint comes in Phase 2.

**Deliverable:** `GET /projects/{id}/tasks`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}` all work. `GET /items/{id}/analyses` returns `[]` (no analyses yet). `GET /health` returns `{"status": "ok"}`.

**Steps:**
- [x] Create `backend/app/schemas/task.py` — `TaskResponse`, `TaskStatusUpdate` (status, priority?)
- [x] Create `backend/app/schemas/analysis.py` — `AnalysisResponse` (all fields; `recommendations` typed as `list[dict]`)
- [x] Create `backend/app/routers/tasks.py`:
  - `GET /projects/{id}/tasks` — list tasks, optional `?status=` filter
  - `PATCH /tasks/{id}` — update status and/or priority
  - `DELETE /tasks/{id}` — hard delete
- [x] Create `backend/app/routers/analyses.py`:
  - `GET /items/{id}/analyses` — list analyses ordered by `created_at DESC`
  - Leave `POST /items/{id}/analyze` as a placeholder raising `501 Not Implemented` (wired in Phase 2)
- [x] Add `GET /health` to `main.py` (not behind auth): returns `{"status": "ok", "watsonx": "unknown"}` — watsonx status filled in Phase 2
- [x] Mount all routers in `main.py`

---

### T1.9 — Backend tests (foundation)
**What:** Write the two focused tests that guard the most critical invariants: stage validation and project ownership.

**Deliverable:** `pytest backend/tests/` passes with two test files, zero failures.

**Steps:**
- [x] Create `backend/tests/conftest.py` — `AsyncClient` fixture using `httpx.AsyncClient` with the FastAPI app; in-memory SQLite for test DB (override `DATABASE_URL` in settings); mock Supabase auth dependency to return a fixed `user_id`
- [x] Create `backend/tests/test_stage_seeding.py`:
  - Test: `POST /projects/{id}/items` with a valid stage name succeeds
  - Test: `POST /projects/{id}/items` with an invalid stage name returns `422`
  - Test: `GET /projects/{id}/items` returns items grouped correctly by stage key
- [x] Create `backend/tests/test_projects.py`:
  - Test: `POST /projects` creates a project and returns it
  - Test: `PATCH /projects/{id}` with a different `user_id` (different mock) returns `404`
  - Test: `DELETE /projects/{id}` removes the project; subsequent `GET` returns `404`
- [x] Confirm `ruff check backend/` passes with zero warnings

---

## Phase 2 — AI Agents

> Goal: the three production agents (Brief, Script, Asset) working end-to-end through the dispatch system, plus the demo seed endpoint. This is the judging differentiator and must be solid before any frontend work.

---

### T2.1 — watsonx client
**What:** Implement the `WatsonxClient` wrapper around `ibm-watsonx-ai`. This is the only place in the codebase that talks to IBM's API.

**Deliverable:** `WatsonxClient` instantiates without error when env vars are set. `generate_text()` and `analyze_image()` call the correct SDK methods. The `GET /health` endpoint now reports `"watsonx": "connected"` or `"watsonx": "error"`.

**Steps:**
- [x] Add `ibm-watsonx-ai` to `requirements.txt`
- [x] Create `backend/app/agents/watsonx_client.py`:
  - `class WatsonxClient` — constructor takes `api_key`, `project_id`, `url` from settings
  - `async def generate_text(self, model_id: str, system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str` — calls `ModelInference.generate_text()`; returns raw string
  - `async def analyze_image(self, model_id: str, image_bytes: bytes, prompt: str) -> str` — base64-encodes `image_bytes`, calls vision endpoint; returns raw string
  - Module-level `_client: WatsonxClient | None = None` singleton; `get_client()` factory function
- [x] Update `main.py` lifespan to instantiate the client and attempt a lightweight health ping; update `GET /health` to reflect the result as `"watsonx": "connected" | "error"`
- [x] Verify `GET /health` connected/error behavior with mocked SDK tests; live-credential smoke testing remains a deployment check

**Constraints:** `generate_text` must be `async` even if the underlying SDK call is sync — wrap in `asyncio.to_thread()`. Do not let SDK exceptions propagate unhandled; catch and re-raise as `WatsonxError`.

---

### T2.2 — AgentBase and AnalysisResult
**What:** Define the abstract base class and the shared output type all agents produce. Every agent is just a different implementation of `analyze()`.

**Deliverable:** `from app.agents.base_agent import AgentBase, AnalysisResult` imports cleanly. The dataclass fields match `Analysis` ORM model exactly.

**Steps:**
- [x] Create `backend/app/agents/base_agent.py`:
  ```python
  @dataclass
  class Recommendation:
      title: str
      detail: str
      priority: Literal["low", "medium", "high"]

  @dataclass
  class AnalysisResult:
      agent_type: str
      summary: str
      recommendations: list[Recommendation]
      score_metrics: dict[str, Any]
      model_id: str
      tasks_to_create: list[dict]  # [{title, description, priority}]

  class AgentBase(ABC):
      def __init__(self, client: WatsonxClient): ...
      @abstractmethod
      async def analyze(self, item: Item) -> AnalysisResult: ...
  ```
- [x] Add a `parse_json_response(raw: str) -> dict` utility in `base_agent.py`:
  - Try `json.loads(raw)` first
  - Fall back to extracting the first `{...}` block via regex if the model wraps output in markdown
  - Raise `ValueError` with the raw string if both fail (caller handles gracefully)
- [x] Write one unit test in `tests/test_agents.py` verifying `parse_json_response` handles both clean JSON and markdown-wrapped JSON correctly

---

### T2.3 — Brief Agent
**What:** Implement the first production agent. Analyses creative briefs for objectives, gaps, and clarity.

**Deliverable:** `BriefAgent.analyze(item)` returns a valid `AnalysisResult` when called with a mock item. The output `tasks_to_create` list has one entry per `missing_info` item.

**Steps:**
- [x] Create `backend/app/agents/brief_agent.py`:
  - System prompt: "You are an expert creative operations analyst for StoryOps Studio. Analyze the following creative brief and respond with a JSON object only — no explanation, no markdown."
  - User prompt: sends `item.content` and requests `{objectives: string[], constraints: string[], missing_info: string[], clarity_score: number (0-10)}`
  - Call `client.generate_text("ibm/granite-3-8b-instruct", system_prompt, user_prompt)`
  - Parse with `parse_json_response()`; build `AnalysisResult`
  - `tasks_to_create`: `[{"title": f"Add missing info: {m}", "description": m, "priority": "medium"} for m in parsed["missing_info"]]`
  - `score_metrics`: `{"clarity_score": parsed["clarity_score"]}`
- [x] Add test in `tests/test_agents.py`: mock `WatsonxClient.generate_text` to return a known JSON string; assert `result.score_metrics["clarity_score"]` is correct and `len(result.tasks_to_create) == len(missing_info_items)`

---

### T2.4 — Script Agent
**What:** Implement the script analysis agent. Analyses hooks, pacing, and CTA for YouTube/ad/podcast scripts.

**Deliverable:** `ScriptAgent.analyze(item)` returns a valid `AnalysisResult`. `tasks_to_create` contains up to 3 entries, prioritized by `retention_risk`.

**Steps:**
- [x] Create `backend/app/agents/script_agent.py`:
  - Read `content_type = item.metadata.get("content_type", "youtube")` — controls tone of prompt
  - System prompt: StoryOps Studio context + content type
  - User prompt: sends `item.content` and requests `{hook_strength: number, pacing_notes: string[], cta_present: bool, retention_risk: "low"|"medium"|"high", improvements: [{title: string, detail: string}]}`
  - Parse; build `AnalysisResult`
  - `tasks_to_create`: top 3 improvements, priority = `retention_risk` value
  - `score_metrics`: `{"hook_strength": ..., "cta_present": ..., "retention_risk": ...}`
- [x] Add test: mock response with known JSON; assert `len(tasks_to_create) <= 3` and `tasks_to_create[0]["priority"]` matches `retention_risk`

---

### T2.5 — Asset Agent
**What:** Implement the image analysis agent using Granite Vision. Analyses thumbnails for brand consistency.

**Deliverable:** `AssetAgent.analyze(item)` fetches an image from `item.file_url`, base64-encodes it, calls `analyze_image()`, and returns a valid `AnalysisResult`. Tasks are created only for medium/high severity issues.

**Steps:**
- [x] Create `backend/app/agents/asset_agent.py`:
  - `_fetch_image_bytes(url: str) -> bytes` helper using `httpx.AsyncClient` — fetches the image from Supabase Storage URL
  - System prompt: "You are a brand consistency auditor for StoryOps Studio. Analyze the provided thumbnail image and respond with a JSON object only."
  - Prompt requests: `{brand_consistency: number (0-10), logo_integrity: "pass"|"flag"|"fail", issues: [{element: string, description: string, severity: "low"|"medium"|"high"}]}`
  - Call `client.analyze_image(model_id, image_bytes, prompt)`
  - Parse; filter issues to `severity in ("medium", "high")` for `tasks_to_create`
  - `score_metrics`: `{"brand_consistency": ..., "logo_integrity": ...}`
- [x] Add test: mock `_fetch_image_bytes` to return dummy bytes; mock `analyze_image` to return known JSON; assert only medium/high issues become tasks

**Constraints:** `analyze_image` receives `bytes`, not a URL. The watsonx client base64-encodes those bytes exactly once when constructing the multimodal request.

---

### T2.6 — Edit, Performance, and Feedback rules agents
**What:** Implement deterministic agents so the dispatcher handles every non-Granite item type without placeholder responses.

**Deliverable:** Edit timing, performance metrics, and feedback notes return well-formed, actionable `AnalysisResult` records without requiring watsonx.

**Steps:**
- [x] Create `backend/app/agents/edit_agent.py` with validated scene-duration and pacing analysis
- [x] Create `backend/app/agents/performance_agent.py` with retention and CTR analysis
- [x] Create `backend/app/agents/feedback_agent.py` with actionable note extraction
- [x] Add focused tests for every rules agent

---

### T2.7 — Dispatcher and analysis endpoint
**What:** Wire the `AGENT_MAP`, the `dispatch()` function, and connect it to `POST /items/{id}/analyze`. This is the endpoint that makes the whole system work.

**Deliverable:** `POST /items/{id}/analyze` on a brief item calls `BriefAgent`, persists an `Analysis` row, auto-creates `Task` rows, and returns the persisted `AnalysisResponse`. Same for script and asset.

**Steps:**
- [x] Create `backend/app/agents/dispatcher.py`:
  ```python
  AGENT_MAP: dict[str, type[AgentBase]] = {
      "brief":       BriefAgent,
      "script":      ScriptAgent,
      "asset":       AssetAgent,
      "edit":        EditAgent,
      "feedback":    EditAgent,
      "metric":      PerformanceAgent,
  }

  async def dispatch(item: Item, db: AsyncSession) -> Analysis:
      agent_cls = AGENT_MAP.get(item.type)
      if not agent_cls:
          raise ValueError(f"No agent for item type: {item.type}")
      agent = agent_cls(get_client())
      result = await agent.analyze(item)
      analysis = Analysis(
          item_id=item.id,
          agent_type=result.agent_type,
          summary=result.summary,
          recommendations=[r.__dict__ for r in result.recommendations],
          score_metrics=result.score_metrics,
          model_id=result.model_id,
      )
      db.add(analysis)
      for t in result.tasks_to_create:
          db.add(Task(project_id=item.project_id, linked_item_id=item.id, **t))
      await db.commit()
      await db.refresh(analysis)
      return analysis
  ```
- [x] Update `backend/app/routers/analyses.py`: replace the `501` placeholder with a real `POST /items/{id}/analyze` handler that calls `dispatcher.dispatch(item, db)` and returns the `AnalysisResponse`
- [x] Add integration test in `tests/test_agents.py`: mock `WatsonxClient`, call `POST /items/{id}/analyze` via test client, assert analysis row and tasks are created in test DB

---

### T2.8 — Demo sample content
**What:** Write the three demo files. These are the content that judges will see when they click "Seed Demo" — they must be polished and trigger meaningful AI output.

**Deliverable:** Three files exist in `backend/demo/` with realistic, high-quality content that will produce interesting Granite analysis results.

**Steps:**
- [x] Write `backend/demo/sample-brief.txt` — a YouTube video brief for a video titled "How AI Is Changing Creative Work (And What You Should Do About It)". Include: target audience, key messages, tone, desired length — but **deliberately omit** a clear CTA and leave the distribution channel undefined (so Brief Agent flags these as `missing_info`)
- [x] Write `backend/demo/sample-script.txt` — a 3-minute YouTube script with: a weak opening line instead of a hook, good middle section, and no explicit CTA at the end. Include `[HOOK]`, `[MAIN POINT 1]`, `[MAIN POINT 2]`, `[CTA]` markers to make the structure readable
- [x] Source or create `backend/demo/sample-thumbnail.jpg` — a simple thumbnail image. Can be a placeholder 1280×720 JPEG created programmatically (solid colour with text). The goal is for the Asset Agent to receive a real image and return a real response, even if the "brand issues" are minimal

**Constraints:** `sample-thumbnail.jpg` must be a real JPEG that can be base64-encoded and submitted to the Granite Vision API — not a placeholder path.

---

### T2.9 — Demo seed endpoint
**What:** Implement `POST /demo/seed` — the single endpoint that creates a full pre-analyzed project in one call. This is the judging demo entry point.

**Deliverable:** Authenticated `POST /demo/seed` returns
`{"project_id": "<uuid>"}`. Navigating to that project in the UI shows a fully
populated pipeline with analyses and tasks on three items.

**Steps:**
- [x] Create `backend/app/routers/demo.py`:
  - `POST /demo/seed` — no auth dependency
  - Creates project: name=`"YouTube Series — AI Explained"`, description=`"Demo project for StoryOps Studio — IBM AI Builders Challenge 2026"`
  - Creates 4 items:
    - stage=`"Script"`, type=`"brief"`, title=`"Video Brief"`, content=read from `demo/sample-brief.txt`
    - stage=`"Script"`, type=`"script"`, title=`"Script Draft v1"`, content=read from `demo/sample-script.txt`, metadata=`{"content_type": "youtube"}`
    - stage=`"Assets"`, type=`"asset"`, title=`"Thumbnail v1"` — upload `demo/sample-thumbnail.jpg` to Supabase Storage, set `file_url`
    - stage=`"Feedback"`, type=`"feedback"`, title=`"Director Notes"`, content=`"Great energy in the second half. The opening hook needs work — we lose viewers in the first 15 seconds. Also missing a clear subscribe CTA."`
  - Calls `dispatcher.dispatch()` on the first three items (brief, script, asset); feedback remains available for manual analysis
  - Returns `{"project_id": str(project.id)}`
- [x] Mount `demo_router` in `main.py`
- [x] Run an automated end-to-end API test with mocked watsonx/Storage services and verify the project, items, analyses, and tasks in the test database; live Supabase validation remains a deployment check

**Constraints:** `demo/seed` uses a fixed owner fallback so it works without auth. When a valid bearer token is supplied, the project belongs to that user so the authenticated frontend can navigate to it through the protected project APIs.

---

## Phase 3 — Frontend Foundation

> Goal: a working Next.js app with auth, dashboard, and the pipeline kanban, all connected to the live backend.

---

### T3.1 — Frontend config, types, and API client
**What:** Install shadcn/ui, define all TypeScript types, and implement the two core library files. Everything else in the frontend depends on these.

**Deliverable:** `lib/api.ts` exports typed functions for every backend endpoint. `types/index.ts` mirrors the backend Pydantic schemas exactly. shadcn/ui components are importable.

**Steps:**
- [x] Run `npx shadcn@latest init` in `frontend/`; use the current Radix Nova preset, Tailwind 4, and CSS variables
- [x] Add shadcn components: Button, Card, Badge, Dialog, Sheet, Spinner, Skeleton, Input, Textarea, Select, Label, and Alert
- [x] Create `frontend/types/index.ts`:
  ```typescript
  export interface Project { id: string; owner_id: string; name: string; description: string | null; repo_url: string | null; created_at: string; updated_at: string; item_counts: Record<string, number> }
  export interface Recommendation { title: string; detail: string; priority: "low" | "medium" | "high" }
  export interface Analysis { id: string; item_id: string; agent_type: string; summary: string; recommendations: Recommendation[]; score_metrics: Record<string, unknown>; model_id: string; created_at: string }
  export interface Item { id: string; project_id: string; stage: string; type: string; title: string; content: string | null; file_url: string | null; metadata: Record<string, unknown>; created_at: string; updated_at: string; latest_analysis: Analysis | null }
  export interface Task { id: string; project_id: string; linked_item_id: string | null; title: string; description: string | null; status: "todo" | "in_progress" | "done"; priority: "low" | "medium" | "high"; created_at: string; updated_at: string }
  export const PIPELINE_STAGES = ["Idea", "Script", "Assets", "Edit", "Feedback", "Publish", "Analyze"] as const
  export type PipelineStage = typeof PIPELINE_STAGES[number]
  ```
- [x] Create environment-specific clients under `frontend/utils/supabase/` using the project URL and publishable key
- [x] Create `frontend/lib/api.ts` — async functions wrapping `fetch`:
  - `apiRequest(path, options?)` — base function; reads auth token from Supabase session; sets `Authorization: Bearer` header; throws on non-2xx
  - `getProjects()`, `createProject(data)`, `getProjectItems(id)`, `createItem(projectId, data)`, `analyzeItem(itemId)`, `getItemAnalyses(itemId)`, `getProjectTasks(projectId)`, `updateTaskStatus(taskId, status)`, `seedDemo()`
- [x] Create `frontend/.env.local.example` with three vars and ensure Git tracks it

---

### T3.2 — Auth pages
**What:** Implement login and register pages using Supabase Auth. After login, redirect to `/dashboard`.

**Deliverable:** A new user can register, verify email (if required), log in, and land on `/dashboard`. An unauthenticated user hitting `/dashboard` is redirected to `/login`.

**Steps:**
- [x] Install `@supabase/ssr` and `@supabase/supabase-js`
- [x] Create `frontend/app/(auth)/login/page.tsx` — email + password form using `signInWithPassword()` and dashboard redirect
- [x] Create `frontend/app/(auth)/register/page.tsx` — account creation with immediate-session and email-confirmation states
- [x] Add Cloudflare-compatible Next.js middleware using `@supabase/ssr` to
  refresh cookies and protect `/dashboard` and `/projects`
- [x] Create Supabase confirmation/error routes and update the root layout metadata and application shell

---

### T3.3 — Dashboard page
**What:** Build the project list dashboard — the first thing a user sees after login.

**Deliverable:** Dashboard shows all user projects as cards. "New Project" modal works. "Seed Demo" button creates a demo project and navigates to it. `WatsonxStatusBadge` shows health.

**Steps:**
- [x] Create `frontend/components/shared/WatsonxStatusBadge.tsx` — fetches `GET /health`, renders connected/checking/unavailable states, and supports retry
- [x] Create `frontend/components/shared/Header.tsx` — app name, Dashboard navigation, user email, and sign-out
- [x] Create `frontend/app/dashboard/page.tsx`:
  - Fetch `getProjects()` on load; render project cards (name, description, item count total, last updated)
  - "New Project" `<Dialog>` with name + description fields; calls `createProject()` on submit; optimistic append to list
  - "Seed Demo" button — calls `seedDemo()`; on success `router.push(`/projects/${project_id}`)` ; show loading state
  - `WatsonxStatusBadge` in top-right of header
- [x] Handle loading, empty, error, retry, expired-session, and mutation states

---

### T3.4 — Pipeline board components
**What:** Build the three pipeline components: `PipelineBoard`, `StageColumn`, and `ItemCard`. These are pure presentational components taking props — no API calls inside them.

**Deliverable:** `PipelineBoard` renders 7 correctly-labelled columns. `ItemCard` shows title, type badge, and a coloured analysis indicator dot. All three pass TypeScript type-check.

**Steps:**
- [x] Create `frontend/components/pipeline/ItemCard.tsx`:
  - Props: `item: Item`
  - Renders: title, `<Badge>` for `item.type`, coloured dot for analysis status
  - Analysis dot logic: grey = no analysis, green = has analysis and no open tasks, red = has open tasks (derive from `latest_analysis !== null` — task count not available on item card; simplify to grey/green only for now)
  - Entire card is a `<Link>` to `/projects/{projectId}/items/{itemId}`
- [x] Create `frontend/components/pipeline/StageColumn.tsx`:
  - Props: `stage: string`, `items: Item[]`, `onAddItem: () => void`
  - Renders: stage name header, list of `<ItemCard>`, "+ Add" button at bottom
- [x] Create `frontend/components/pipeline/PipelineBoard.tsx`:
  - Props: `itemsByStage: Record<string, Item[]>`, `onAddItem: (stage: string) => void`
  - Renders: horizontal scroll container with `<StageColumn>` for each of `PIPELINE_STAGES`
  - Passes `items={itemsByStage[stage] ?? []}` to each column

---

### T3.5 — Pipeline page and Add Item sheet
**What:** Wire the pipeline page to the backend and implement the "Add Item" slide-over.

**Deliverable:** Navigating to `/projects/[id]` shows the live kanban board. Clicking "+ Add" in any column opens a slide-over. Submitting the form adds the item and it appears in the correct column immediately (optimistic update).

**Steps:**
- [x] Create `frontend/app/projects/[id]/page.tsx`:
  - Fetch `getProjectItems(id)` on load; group items by `stage` into `Record<string, Item[]>`
  - Render `<PipelineBoard>` with the grouped items
  - State: `addingToStage: string | null` for controlling the add-item sheet
  - Pass `onAddItem={(stage) => setAddingToStage(stage)}` to `PipelineBoard`
- [x] Create `frontend/components/pipeline/AddItemSheet.tsx`:
  - shadcn `<Sheet>` slide-over
  - Form fields: title (text input), type (select from `ITEM_TYPES`), dynamic field: if type is `"asset"`, show file picker; otherwise show textarea for content
  - On submit: call `createItem(projectId, {stage: addingToStage, type, title, content?, file?})`
  - On success: optimistically add item to local state; close sheet

---

## Phase 4 — Item Detail and Task Board

> Goal: the two remaining UI pages that complete the core user journey — analyzing an item and managing the resulting tasks.

---

### T4.1 — Item detail page layout
**What:** Build the item detail page shell with content display. No analysis panel yet — just the layout and content rendering.

**Deliverable:** Navigating from an `ItemCard` to `/projects/[id]/items/[itemId]` shows the item's content or image. Breadcrumb navigates back to the pipeline.

**Steps:**
- [x] Create `frontend/app/projects/[id]/items/[itemId]/page.tsx`:
  - Fetch item via `GET /items/{id}` (add `getItem(id)` to `lib/api.ts`)
  - Two-column layout: left 60% for content, right 40% for analysis (placeholder for T4.2)
  - Content display: if `item.file_url`, render `<img src={item.file_url}>` with max-height; if `item.content`, render `<pre>` with word-wrap
  - Breadcrumb: "Dashboard / [project name] / [item title]" with correct links
  - Show `<Badge>` for `item.type` and `item.stage`
- [x] Add `getItem(id: string): Promise<Item>` to `lib/api.ts`

---

### T4.2 — Analysis panel and Analyze button
**What:** Build the `AnalysisPanel` component and wire the "Analyze" button to `POST /items/{id}/analyze`.

**Deliverable:** Clicking "Analyze" shows a loading spinner, calls the backend, and renders the returned analysis. Recommendations appear as a list with colour-coded priority badges. Score metrics appear as number badges.

**Steps:**
- [x] Create `frontend/components/items/AnalysisPanel.tsx`:
  - Props: `analysis: Analysis | null`, `isAnalyzing: boolean`, `onAnalyze: () => void`
  - When `analysis === null` and not analyzing: show "No analysis yet" + "Analyze" button
  - When `isAnalyzing`: show spinner + "Analyzing with IBM Granite..."
  - When `analysis` present:
    - Summary text block
    - Score metrics: render each `score_metrics` key-value pair as a `<Badge variant="outline">` — e.g., `hook_strength: 4`
    - Recommendations list: each `Recommendation` as a card with title, detail, and priority badge (green=low, amber=medium, red=high)
    - "Re-analyze" button
- [x] Wire into `ItemDetail` page:
  - `analyzing` state, initialized to `false`
  - `handleAnalyze()`: sets `analyzing = true`; calls `analyzeItem(itemId)`; on response sets `analysis` state and `analyzing = false`
  - Pass `analysis={item.latest_analysis}` initially; update after re-analysis

---

### T4.3 — Task board page
**What:** Build the task board showing all AI-generated tasks for a project in three status columns.

**Deliverable:** `/projects/[id]/tasks` shows tasks grouped into Todo / In Progress / Done. Status change buttons work and update immediately.

**Steps:**
- [x] Create `frontend/components/tasks/TaskCard.tsx`:
  - Props: `task: Task`, `onStatusChange: (newStatus: string) => void`
  - Renders: title, description (if any), priority badge, linked item name (link to item detail if `linked_item_id`)
  - Status change: three small buttons ("Todo" / "In Progress" / "Done"); active one highlighted; clicking inactive one calls `onStatusChange`
- [x] Create `frontend/app/projects/[id]/tasks/page.tsx`:
  - Fetch `getProjectTasks(id)` on load
  - Group tasks by `status`
  - Render three columns each showing a filtered list of `<TaskCard>`
  - `handleStatusChange(taskId, newStatus)`: calls `updateTaskStatus(taskId, newStatus)`; optimistic update in local state
  - Empty state per column: "No tasks here"
  - Link back to pipeline in breadcrumb
- [x] Add a "Tasks" button on the pipeline page pointing to `/projects/[id]/tasks`

---

## Phase 5 — Docs, CI, and Deploy

> Goal: everything judges read and run. The repo must be self-explanatory, the CI must pass, and the demo must work end-to-end on the deployed URLs.

---

### T5.1 — GitHub Actions CI
**What:** Add two CI workflows so every push validates the codebase automatically.

**Deliverable:** Both workflows appear in GitHub Actions and pass on the main branch. A broken push shows a red check.

**Steps:**
- [x] Create `.github/workflows/backend-ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with: {python-version: "3.11"}
        - run: pip install -r requirements-dev.txt -r requirements.txt
          working-directory: backend
        - run: ruff check app/ tests/
          working-directory: backend
        - run: pytest tests/ -x
          working-directory: backend
          env:
            DATABASE_URL: sqlite+aiosqlite:///./test.db
            WATSONX_API_KEY: dummy
            WATSONX_PROJECT_ID: dummy
            WATSONX_URL: https://us-south.ml.cloud.ibm.com
            SUPABASE_URL: https://dummy.supabase.co
            SUPABASE_PUBLISHABLE_KEY: dummy
            SUPABASE_SECRET_KEY: dummy
            SUPABASE_JWKS_URL: https://dummy.supabase.co/auth/v1/.well-known/jwks.json
  ```
- [x] Create `.github/workflows/frontend-ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    typecheck:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: {node-version: "22.13.0"}
        - run: npm ci
          working-directory: frontend
        - run: npx tsc --noEmit
          working-directory: frontend
        - run: npm run lint
          working-directory: frontend
  ```
- [x] Validate workflows with actionlint and run all CI commands locally
- [x] Confirm both workflows pass on GitHub `main`

---

### T5.2 — Deployment: production backend
**What:** Deploy the REST contract on Cloudflare and retain the Dockerized
FastAPI/Render path for IBM Granite credentials.

**Deliverable:** The live API health endpoint reports connected production data
and exposes every authenticated StoryOps route.

**Steps:**
- [x] Create a non-root `backend/Dockerfile` and secret-safe `.dockerignore`
- [x] Use Render's `$PORT` in the container command and add liveness/readiness probes
- [x] Create and validate `render.yaml` with Docker, pre-deploy migration, health check, and secret declarations
- [x] Build and smoke-test the release image locally, including non-root execution and secret exclusion
- [x] Deploy and verify `https://storyops-api.ukexe06.workers.dev`
- [x] Add the Cloudflare Worker adapter to backend CI
- [ ] Deploy the optional FastAPI/Render runtime after valid IBM credentials and
  an authorized Python container host are available

---

### T5.3 — Deployment: frontend on Cloudflare
**What:** Deploy the Next.js frontend to Cloudflare Workers through OpenNext and Wrangler.

**Deliverable:** `https://storyops.ukexe06.workers.dev/dashboard` loads the live
app and **Seed demo** works end to end.

**Steps:**
- [x] Add OpenNext and Wrangler configuration for the `storyops` Worker
- [x] Validate the Worker bundle and Wrangler dry run
- [x] Deploy and smoke-test `https://storyops.ukexe06.workers.dev`
- [x] Configure the Supabase URL and publishable key in the Worker
- [x] Add the deployed Cloudflare URL to Supabase Auth Site URL and redirect list
- [x] Configure the production REST URL and verify the full dashboard pipeline

---

### T5.4 — `docs/architecture.md`
**What:** Write the architecture document — a key IBM Bob SDLC evidence artifact that judges review in the repo.

**Deliverable:** `docs/architecture.md` exists with a complete system diagram, component descriptions, DB schema summary, agent dispatch flow, and a section explicitly documenting IBM Bob's role across the development lifecycle.

**Steps:**
- [x] Write **System Architecture** section: Browser → Cloudflare → Render → Supabase → watsonx.ai
- [x] Write **Component Reference** for the client, agents, dispatcher, auth, storage, and probes
- [x] Write **Database Schema** and RLS/security decisions
- [x] Write **Agent Dispatch Flow** from request through atomic persistence
- [x] Write **IBM Bob Usage** section:
  - Plan mode: architecture design, DB schema, agent dispatch design (reference this plan document)
  - Agent mode: backend scaffold, ORM models, router implementation, agent implementation
  - Ask mode: debugging watsonx SDK integration, refactoring dispatcher
  - Document specific Bob interactions that shaped key decisions

---

### T5.5 — `README.md`
**What:** Write the complete project README — the first thing judges and users read.

**Deliverable:** A judge can read README, clone the repo, set up env vars, and run the full stack locally in under 10 minutes.

**Steps:**
- [x] Write **Overview** section: users, problem, and workflow
- [x] Write **Architecture** section and link to `docs/architecture.md`
- [x] Write **IBM Bob Usage** section and evidence boundary
- [x] Write **IBM Granite + watsonx Integration** section
- [x] Write **Setup** section:
  ```
  Prerequisites: Python 3.11, Node 20, Supabase account, watsonx.ai account
  1. Clone repo
  2. Create backend/.env from .env.example; fill in values
  3. Create frontend/.env.local from .env.local.example; fill in values
  4. cd backend && pip install -r requirements.txt && alembic upgrade head
  5. uvicorn app.main:app --reload
  6. cd frontend && npm install && npm run dev
  ```
- [x] Write **Demo Script** section with Seed demo entry point
- [x] Add release, local validation, and license badges
- [x] Add the live Cloudflare deployment badge
- [x] Add live GitHub Actions badges

---

### T5.6 — `docs/demo-walkthrough.md` and final smoke test
**What:** Write the reproducible demo guide and run a complete end-to-end verification against the deployed system.

**Deliverable:** A judge can follow `demo-walkthrough.md` step by step and reproduce the full demo. All steps work against the production URLs.

**Steps:**
- [x] Write `docs/demo-walkthrough.md`:
  1. Open `https://<vercel-url>`; log in or register
  2. On Dashboard, verify green "Watsonx Connected" badge
  3. Click "Seed Demo"; watch redirect to the new project pipeline
  4. Pipeline shows 4 items across stages; 3 have green analysis indicators
  5. Click the "Video Brief" card; show Brief Agent analysis with clarity score and missing info tasks
  6. Click the "Script Draft v1" card; show Script Agent hook strength, retention risk, improvement tasks
  7. Click the "Thumbnail v1" card; show Asset Agent brand consistency score and issues
  8. Navigate to Tasks board; show all auto-generated tasks across Todo column
  9. Mark one task "In Progress"; verify it moves column
- [x] Run local CI-equivalent, migration, dependency, frontend build, and Docker smoke checks
- [x] Run the full authenticated walkthrough against the deployed Cloudflare
  frontend, API, Supabase Auth, Postgres, and private Storage
- [x] Prepare the local `v1.0.0` release commit and annotated tag
- [x] Push the `v1.0.0` tag
- [x] Publish the
  [v1.1.0 GitHub Release](https://github.com/ukexe/Storyops_studio/releases/tag/v1.1.0)
- [ ] Add the public demo video URL to README and release notes

**Production status:** Cloudflare frontend/API, Supabase schema/Auth/private
Storage, and the complete persisted browser journey are verified. Real Granite
inference remains gated only by valid IBM credentials; production explicitly
uses and labels deterministic edge-agent mode.

---

## Dependency Map

```
T1.1 → T1.2 → T1.3 → T1.4 → T1.5
                              T1.5 → T1.6 → T1.7 → T1.8 → T1.9

T1.8 → T2.1 → T2.2 → T2.3
                      T2.3 → T2.7
              T2.2 → T2.4 → T2.7
              T2.2 → T2.5 → T2.7
              T2.2 → T2.6 → T2.7
                             T2.7 → T2.8 → T2.9

T2.9 → T3.1 → T3.2 → T3.3 → T3.4 → T3.5

T3.5 → T4.1 → T4.2
T3.5 → T4.3

T4.2, T4.3 → T5.1 → T5.2 → T5.3 → T5.4 → T5.5 → T5.6
```

**Parallel-safe groups** (can be worked simultaneously by two people):
- T2.3, T2.4, T2.5, T2.6 — four agents are independent once T2.2 is done
- T3.4 — pure presentational components, can be built while T3.2/T3.3 are in progress
- T4.1, T4.3 — item detail layout and task board are independent of each other
- T5.4, T5.5 — architecture doc and README are independent of each other
