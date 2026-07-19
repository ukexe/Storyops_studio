# StoryOps Studio v2.1.0 engineering report

## Executive result

StoryOps Studio v2.1.0 transforms the project AI console into a multimodal AI
Asset Studio while preserving the deployed creative-production workflow,
canonical Granite path, ownership boundary, and explainable control plane.

Release endpoints:

- Frontend: <https://storyops.ukexe06.workers.dev>
- API: <https://storyops-api.ukexe06.workers.dev>
- Database, Auth, and private Storage: Supabase
- Schema head: `73ff11ca1f26`
- Production reasoning model: `openai/gpt-5.6-luna`
- Production image model: `openai/gpt-image-1.5`
- Validated Git commit: `d210514`
- API Worker version: `fc45b72e-e5c0-4cb5-9fa4-764a7dcb9a67`
- Frontend Worker version: `4e536aff-efff-4e6f-8aaf-6b3b1bd2ef26`

Authenticated production acceptance verified the `2026-v2` demo seed, rich PRD
generation, rendered Mermaid/SVG output, GPT Image 1.5 generation, private
1536×1024 signed image delivery, workflow-step reload, timeline events, and
source-linked replay execution. The temporary project, generated Storage
object, and Auth user were removed after verification.

## Completed enhancements

### Product identity

- Removed all retired branding from current source, filenames, UI, prompts,
  metadata, documentation, and vector artwork.
- Renamed the public experience, architecture document, provider badge, and
  historical migration filename without changing the applied revision ID or DDL.
- Reframed simulated knowledge-map, integrations, durable workflows, and impact
  forecasting as roadmap rather than live behavior.
- Bumped all runtime/package versions to `2.1.0` and demo seed to `2026-v2`.

### AI Asset Studio

The authenticated `/projects/[id]/console` route now supports eight guided
categories:

1. Documentation
2. Visual
3. Architecture
4. Engineering
5. Product
6. Business
7. Marketing
8. Analytics

Supported durable output formats:

- Rich Markdown documents
- Mermaid diagrams and charts
- Syntax-highlighted code
- Structured JSON
- Private generated images
- Plain text fallback

The template library covers PRDs, specifications, stories, acceptance criteria,
release notes, SOPs, illustrations, storyboards, character concepts, logos,
banners, social graphics, architecture/data-flow/sequence/deployment/ER
diagrams, SQL, OpenAPI, JSON Schema, TypeScript types, roadmaps, sprint plans,
risks, personas, journeys, pitch narratives, executive/ROI/market reports,
landing/blog/launch/email/ad copy, KPI dashboards, Gantt charts, burndown
charts, and progress reports.

### Professional output rendering

- Safe `react-markdown` and GFM rendering with raw HTML disabled
- Responsive headings, lists, tables, links, callouts, and typography
- Prism token-based syntax highlighting and copy controls
- Lazy-loaded Mermaid rendering with strict security mode
- Downloadable SVG diagrams
- Private image previews and downloads
- Expanded asset preview dialog
- Format-aware source downloads
- Clear rendering failure states without exposing raw formatting by default

### Durable asset and replay lineage

Alembic revision `73ff11ca1f26` adds:

- `workflow_runs.replayed_from_run_id`
- `workflow_runs.model_id`
- `workflow_runs.prompt_version`
- `artifacts.run_id`
- `artifacts.format`
- `artifacts.mime_type`
- `artifacts.storage_path`
- `artifacts.model_id`
- `artifacts.content_sha256`

Generated images are uploaded to the private project Storage prefix before an
artifact is marked ready. API responses add a short-lived signed URL only after
ownership validation.

Replay requests now carry explicit source run/event IDs. The new run links to
its source, the start event is caused by the selected event, and inference
receives the persisted source run, steps, events, artifacts, recent
conversation, and current project evidence.

Historical workflow steps can be reloaded through
`GET /api/v1/runs/{run_id}/steps`.

### UI and accessibility

- Responsive authenticated mobile navigation
- Global error recovery and 404 pages
- Route-specific Asset Studio and timeline metadata
- Guided edit scene-duration input
- Guided views/retention/CTR input
- Friendly structured metadata and scene timeline rendering
- Recommended actions surfaced as reusable prompts
- IME-safe Enter handling
- Proper tab/tabpanel associations
- Semantic auth-page H1 headings
- Mobile layout verified at 320px without horizontal overflow

### Security and reliability

- Disabled automatic Cloudflare invocation logs that may retain bearer headers
- Preserved structured custom failure logs
- Bounded Worker JSON bodies before parsing
- Bounded declared multipart request sizes
- Sanitized Supabase/PostgREST failures returned to clients
- Rejected credential-bearing repository URLs
- Corrected strict compound event-cursor pagination
- Added `Retry-After` to rate-limit responses
- Added API HSTS
- Enforced project-prefix checks before private asset signing/analysis
- Replaced full creative-content event copies with safe summaries/hashes
- Restricted runtime event access to insert/read
- Separated successful generation from optional timeline-refresh failures
- Added generated-image/artifact compensation on failed runs
- Added a 15-second canonical watsonx startup timeout

## Performance and developer experience

- Mermaid is dynamically imported only when a diagram is rendered.
- The Asset Studio remains isolated to its route bundle.
- Project metrics no longer derive entirely from the 24-item prompt window.
- Recent conversation and artifact context is bounded.
- Generated Cloudflare environment types are checked in CI.
- Frontend CI now builds and dry-runs the actual OpenNext Worker.
- API CI checks Wrangler bindings and the release bundle.
- Public Next.js `X-Powered-By` is disabled.

Validated bundle sizes:

- API Worker: 883.70 KiB upload / 200.71 KiB gzip
- Frontend Worker: 9,802.15 KiB upload / 2,106.79 KiB gzip

## Validation results

Canonical backend:

- Ruff: pass
- Pytest: 39 pass
- pip-audit: no known vulnerabilities
- Alembic: one head at `73ff11ca1f26`
- Full PostgreSQL SQL compilation: pass

Production edge API:

- Vitest: 9 pass
- TypeScript: pass
- Generated Wrangler bindings: current
- npm audit: 0 vulnerabilities
- Wrangler dry run: pass

Frontend:

- ESLint: pass
- Vitest: 5 pass
- Route-aware TypeScript: pass
- Generated Wrangler bindings: current
- npm audit: 0 vulnerabilities
- Linux Node 22.13 OpenNext build: pass
- Frontend Worker dry run: pass
- Local public/auth browser smoke: pass
- Authenticated production Asset Studio journey: pass
- Real OpenAI PRD, Mermaid, and image generation: pass
- Private generated image dimensions: 1536 × 1024
- Source-linked replay execution: pass
- 320px and desktop overflow checks: pass
- No local error overlay or broken images: pass
- Post-deploy Worker error query: zero API errors, zero frontend errors

## Known limitations

- Image editing, masks, and multi-reference variants are not implemented.
- Audio and video generation require separate asynchronous provider workflows.
- True PPTX/PDF generation is deferred; presentation narratives are rendered
  and downloadable as rich documents.
- Durable background jobs, distributed quotas, organizations/RBAC,
  collaboration, semantic search, and project knowledge maps remain roadmap.
- Project deletion remains the governed purge boundary for workspace events.
- The production API and frontend must be deployed in schema-first order.

## Intentionally deferred recommendations

### Durable generation jobs

- Problem: long image/file generation remains request-bound.
- Value: resumable progress, retries, cancellation, and cost governance.
- Complexity: High.
- Priority: High after the hackathon release.
- Reason deferred: requires Cloudflare Workflows/Queues and a job-state UI.

### Organization collaboration and approvals

- Problem: ownership is single-user and artifact status has no approval flow.
- Value: reviewer roles, comments, controlled publication, and agency workflows.
- Complexity: High.
- Priority: Medium.
- Reason deferred: requires a membership/RBAC policy model and migration.

### Source parsing and semantic retrieval

- Problem: project context comes from bounded item text, not parsed long files.
- Value: evidence-addressable citations and cross-project discovery.
- Complexity: High.
- Priority: Medium.
- Reason deferred: requires source versions, chunks, embeddings, authorized
  retrieval, and freshness management.

### Asset revisions and visual editing

- Problem: generated assets are immutable outputs rather than editable variant
  trees.
- Value: image edits, masks, comparison, approval, and brand iteration.
- Complexity: Medium to High.
- Priority: Medium.
- Reason deferred: generation and durable storage were prioritized over a
  rushed editor.

### Distributed quotas and cost telemetry

- Problem: current in-memory request limits are load-smoothing only.
- Value: predictable spend and abuse resistance.
- Complexity: Medium.
- Priority: High before broad public access.
- Reason deferred: requires a durable limiter and account/project budget model.

## External submission work

- Publish the final public demo video/GIF URL.
- Include genuine IBM Bob session screenshots/exports where challenge rules
  require them.
- Optionally deploy the canonical FastAPI/Granite runtime after valid IBM
  credentials and a supported model entitlement are available.
