# Changelog

All notable changes to StoryOps Studio are documented here.

## [2.0.0] - 2026-07-19

### Added

- Interactive enterprise product homepage with live architecture, console,
  capability, discovery pipeline, Atlas, timeline, agent, integration, and
  roadmap explorers
- Authenticated project AI operating console with durable conversations,
  messages, workflow runs, transparent steps, typed tool receipts, confidence,
  model audit IDs, recommended actions, and UI intents
- Reusable executive-report and architecture artifacts with source-message,
  conversation, run, model, and workspace-snapshot lineage
- Append-only workspace event ledger with source, object, actor, correlation,
  causation, model, payload, and reversibility metadata
- Searchable enterprise workspace timeline and non-destructive replay planning
- Alembic revision `4e0683f5a3ed` with six control-plane tables, constraints,
  indexes, RLS hardening, and explicit backend Data API grants
- Alembic revision `7e34a290f9de` protecting migration metadata from public
  Data API access
- Matching FastAPI/Granite and Cloudflare/OpenAI console contracts with
  deterministic audited fallback
- Control-plane ownership, persistence, artifact, fallback, pagination, and
  event tests

### Changed

- Project, item, analysis, task, and demo mutations now emit workspace events.
- Development CSP allows `unsafe-eval` only in development so React debugging
  works without weakening the production policy.
- CSP connection and image sources are derived from the configured API and
  Supabase origins; development no longer upgrades local HTTP API requests.
- Item detail now renders structured edit/performance metadata.
- Item-type changes clear stale file state, and both edge and FastAPI adapters
  reject files on non-asset items.
- Legacy edge demo thumbnails are returned as embedded image data instead of a
  missing frontend path.
- Edge analysis compensates by removing a newly inserted analysis when task
  inspection or persistence fails.
- Project navigation exposes the AI console and workspace timeline.

### Validation and deployment

- Applied and verified the production schema through `7e34a290f9de`.
- Deployed API Worker version `d3674f7c-e879-4fd3-a00d-1343d0f05eff`.
- Deployed frontend Worker version `a04fdb03-cf17-43e5-a2b8-9f34feeb1d8b`.
- Verified production OpenAI console analysis and executive artifact generation.
- Verified workflow steps, event timeline, private schema grants, and cleanup.

## [1.2.0] - 2026-07-19

### Added in 1.2

- OpenAI Responses API production provider using `gpt-5.6-luna`
- Strict structured output for summaries, recommendations, priorities, and
  score metrics
- Multimodal thumbnail analysis from trusted private or demo image bytes
- Provider-aware health, Settings, status badges, and persisted model IDs
- Deterministic edge fallback on provider timeout, refusal, or invalid output

### 1.2 security

- OpenAI API key stored only as a Cloudflare Worker secret
- OpenAI API storage disabled with `store: false`
- Bounded creative content, metadata, image size, output tokens, and timeout
- Sanitized structured fallback logs without creative content or credentials

### 1.2 validation

- Added mocked structured-output and vision-input provider tests
- Added production health, text analysis, vision analysis, persistence, and
  fallback verification
- Updated challenge documentation to disclose OpenAI and retain IBM Bob as the
  primary development tool

## [1.1.0] - 2026-07-19

### Added

- Live Cloudflare REST adapter with the complete authenticated API contract
- Production Supabase schema, least-privilege runtime role, Auth redirects, and
  private signed asset delivery
- Deterministic edge-agent mode with explicit ruleset audit IDs
- Structured edit/performance metadata ingestion in the frontend
- Database UUID defaults, updated-at triggers, demo version uniqueness, and
  linked-task project validation

### Fixed

- Connected the deployed frontend to the live API
- Removed the obsolete Todos example and dead navigation
- Prevented repeated analyses from duplicating open generated tasks
- Added expiring JWKS caching and required JWT claims
- Made database readiness checks reflect current connectivity
- Hardened input/model-output limits, CSP, redirect preservation, and UI
  accessibility state

### Validation

- Verified the complete production browser journey through logout and re-login
- Verified demo seeding, private image upload/signing/cleanup, task persistence,
  ownership, and authentication against live services
- Expanded CI to audit, type-check, and bundle the Cloudflare API adapter

### External dependency

- The available IBM API key and project ID are placeholders. The canonical
  FastAPI Granite agents are complete, while production reports and uses
  deterministic edge-agent mode until valid watsonx credentials are supplied.

## [1.0.0] - 2026-07-18

### Added in 1.0

- Authenticated Next.js creative operations dashboard
- Seven-stage project pipeline and item ingestion
- Brief, Script, Asset, Edit, Performance, and Feedback agents
- Synchronous analysis views and AI-generated task management
- Idempotent judging demo with production fixtures
- Supabase Auth, PostgreSQL, and Storage integration
- Row-level security hardening and database constraints
- Docker, Render, Cloudflare Workers, and GitHub Actions configuration
- Architecture, setup, and demo documentation

### Security

- Restricted browser access to application tables
- Restricted Asset Agent downloads to the configured Storage bucket
- Added exact CORS origin configuration
- Added authenticated production demo seeding
- Added image magic-byte validation and upload limits
- Upgraded backend and frontend dependencies after vulnerability audits
- Added readiness and liveness probes

### 1.0 validation

- Backend test suite, lint, compilation, migration graph, and dependency audit
- Frontend lint, route-aware type-check, production build, and dependency audit
- Docker non-root image, secret exclusion, `$PORT`, liveness, and readiness
- GitHub Actions workflow syntax validation

### External release gates

- Public GitHub remote and workflow runs
- Render account provisioning and production health check
- Production FastAPI provisioning and full dashboard smoke test
- Live Supabase migration, Storage, Auth, and watsonx model validation
- Public demo video URL
