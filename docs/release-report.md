# StoryOps Studio v1.2.0 engineering report

## Executive result

StoryOps Studio is operational in production:

- Frontend: <https://storyops.ukexe06.workers.dev>
- REST API: <https://storyops-api.ukexe06.workers.dev>
- Database, Auth, and Storage: Supabase project `namuaqfivfwopaqkdjuw`
- Applied schema revision: `b91f4d8a2c10`

The authenticated browser journey was exercised through project creation,
content ingestion, analysis, recommendations, generated tasks, task updates,
reload persistence, logout, re-login, and data recovery. Demo seeding and
private image upload/signing/deletion were also exercised against production.

## Repository audit

The pre-existing FastAPI, Next.js, agent, migration, Docker, CI, and
documentation foundations were retained. The blocking gaps were production
data provisioning, a reachable API, frontend API configuration, Auth redirect
configuration, private asset delivery, production acceptance testing, and
several security/contract inconsistencies.

The obsolete Todos starter route was removed because it bypassed the backend
contract and referenced an unmigrated table.

## Implemented work

### Database

- Applied all three Alembic revisions to production.
- Verified `projects`, `items`, `analyses`, and `tasks`.
- Verified primary/foreign keys, cascading behavior, CHECK constraints, indexes,
  JSONB columns, RLS, and revoked browser-role grants.
- Added database-side UUID defaults.
- Added updated-at triggers for mutable tables.
- Added task/item project-consistency enforcement.
- Added versioned, owner-unique demo seeding.
- Provisioned the `assets` bucket with a 10 MB image limit and private access.
- Created and tested a least-privilege `storyops_app` FastAPI runtime role.

### Backend and API

- Preserved the canonical FastAPI implementation and full watsonx SDK agents.
- Added bounded input and model-output validation.
- Added expiring JWKS caching, required claims, and anonymous-session rejection.
- Added dynamic database readiness and exact configured-model health checks.
- Added analysis/demo throttles and generated-task deduplication.
- Added private asset paths, signed reads, secret-key downloads, and cleanup.
- Added a Cloudflare Worker deployment adapter implementing the complete REST
  contract through Supabase Auth, PostgREST, and Storage.
- Added disclosed OpenAI Responses API text and vision analysis with strict
  structured output, provider audit IDs, bounded requests, and API storage
  disabled.
- Added deterministic edge agents for every item type with explicit
  `storyops/edge-*` audit IDs.

### Frontend

- Bound all dashboard routes to the production REST API.
- Added structured JSON ingestion for Edit and Performance agents.
- Added a production Settings page for API, database, analysis-mode, and
  security-boundary status.
- Added accessible success notifications for projects, items, analyses, demo
  seeding, and task updates.
- Added explicit edge-agent status rather than mislabeling fallback output.
- Added a deployed demo thumbnail and private signed user-asset previews.
- Added CSP, narrower session middleware, preserved protected deep-link query
  strings, improved theme state, and descriptive project links.
- Removed all Todos code and navigation.

### CI and release engineering

- Added edge API dependency audit, type-check, unit tests, and Wrangler dry-run
  to backend CI.
- Added repository-history Gitleaks scanning.
- Updated GitHub Actions to current Node 24-based major releases.
- Pinned the Python base image digest.
- Corrected the Render Blueprint to a plan that supports pre-deploy migrations.
- Added the edge API package, deployment config, tests, and runbook.

## Data schema

### `projects`

UUID ID, owner UUID, name, description, repository URL, optional demo version,
and created/updated timestamps.

### `items`

UUID ID, project FK, fixed pipeline stage, item type, title, optional text,
private asset object path, JSONB metadata, and timestamps.

### `analyses`

UUID ID, item FK, agent type, summary, structured recommendations JSONB,
heterogeneous score metrics JSONB, model/ruleset audit ID, and creation time.

### `tasks`

UUID ID, project FK, optional linked item FK, title, description, status,
priority, and timestamps.

## API summary

Public:

- `GET /`
- `GET /live`
- `GET /health`

Authenticated:

- Project list/create/read/update/delete
- Grouped item list, JSON/multipart create, read/update/delete
- Analysis history and synchronous invocation
- Task list/filter/update/delete
- Idempotent demo seed

Every authenticated resource path applies user ownership checks. The live API
returns CORS only for the exact frontend origin and marks responses private and
non-cacheable.

## Agent summary

Canonical FastAPI:

- Brief Agent — IBM Granite Instruct
- Script Agent — IBM Granite Instruct
- Asset Agent — IBM Granite Vision
- Edit Agent — deterministic timing analysis
- Performance Agent — deterministic metric analysis
- Feedback Agent — deterministic actionable-note extraction

Live Cloudflare adapter:

- OpenAI Brief, Script, Asset, Edit, Performance, and Feedback agents
- Structured recommendations, scores, generated tasks, deduplication, and
  explicit `openai/<model>` audit IDs
- Deterministic edge-rules fallback on provider timeout, refusal, invalid
  output, or service failure

The active provider and fallback are intentionally disclosed by `/health`,
Settings, the header badge, and every analysis `model_id`.

## Dependencies added or changed

- Edge API: `@supabase/supabase-js`, Vitest, Wrangler, TypeScript, Workers types
- Frontend: Sonner; Node type definitions aligned to Node 22
- No new Python runtime dependencies

## Validation results

- Python Ruff: pass
- FastAPI tests: 33 tests after final schema validation updates
- Edge API tests: 5 pass
- Frontend tests: 3 pass
- FastAPI and edge TypeScript type-checks: pass
- Frontend route-aware type-check: pass
- Python dependency audit: no known vulnerabilities
- Frontend dependency audit: no known vulnerabilities
- Edge dependency audit: no known vulnerabilities
- Alembic graph and offline PostgreSQL SQL compilation: pass
- Production Supabase schema assertions: pass
- Linux Node 22.13 OpenNext build: pass
- Cloudflare API and frontend deployments: pass
- Production API/auth/private-asset smoke tests: pass
- Real OpenAI text analysis: pass with `openai/gpt-5.6-luna`
- Real OpenAI private-asset vision analysis: pass
- OpenAI demo seed: pass with three provider-backed analyses
- Deliberate provider-input failure: deterministic fallback pass
- Full production browser journey: pass

The native Windows Next.js build occasionally exits with an upstream Turbopack
`kill EPERM` process-cleanup error after successful compilation and type-check.
The release gate uses the successful Linux/OpenNext build that matches the
Cloudflare runtime.

## Performance observations

- The public landing page is statically cached at the edge.
- Auth middleware runs only for auth and personalized routes.
- API execution is edge-local, while durable state remains in managed
  Supabase services.
- Analysis remains synchronous by MVP design.
- Collection pagination and background analysis remain sensible post-MVP
  scaling work.

## Security observations

- No backend secret is browser-visible or committed.
- Application tables reject direct `anon` and `authenticated` access.
- User assets are private and exposed through one-hour signed URLs.
- FastAPI verifies JWT key ID, algorithm, issuer, audience, required claims,
  expiry, UUID subject, and non-anonymous identity.
- The live adapter validates each bearer token with Supabase Auth.
- Tenant ownership is checked on every application resource.
- Asset uploads use magic-byte validation and a 10 MB limit.
- OpenAI receives bounded inputs with `store: false`; its API key is confined to
  a Cloudflare Worker secret.
- CSP, HSTS, frame denial, referrer policy, permissions policy, and exact CORS
  are enabled.
- Secret history scanning and dependency audits run in CI.

## Documentation updates

Updated:

- `AGENTS.md`
- `README.md`
- `CHANGELOG.md`
- `docs/architecture.md`
- `docs/implementation-plan.md`
- `docs/tasks.md`
- `docs/demo-walkthrough.md`
- `docs/release-report.md`

## Remaining external work

1. Optionally obtain watsonx.ai credentials and deploy the canonical FastAPI
   service to demonstrate the retained Granite provider path.
2. Publish the public demo video URL.
3. Exercise a real email-delivery confirmation link with an inbox under the
   final project domain.

These are account/credential or submission-media gates, not missing repository
implementations. The current production experience uses disclosed OpenAI
inference with explicit deterministic fallback.

## IBM AI Builders Challenge readiness

Strengths:

- Clear creative-operations problem and seven-stage workflow
- Six specialized agents with structured recommendations and task handoff
- Production deployment, persistence, private assets, and complete demo path
- Extensive Bob planning/agent/review artifacts
- Strong architecture, CI, security, and reproducible documentation

Provider disclosure:

- IBM Bob remains the primary SDLC tool. OpenAI is the disclosed additional AI
  provider allowed by the published FAQ. The repository retains the real
  watsonx implementation without claiming it is active in production.
