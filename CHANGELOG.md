# Changelog

All notable changes to StoryOps Studio are documented here.

## [1.0.0] - 2026-07-18

### Added

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

### Validation

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
