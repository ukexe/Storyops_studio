# Changelog

All notable changes to StoryOps Studio are documented here.

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
