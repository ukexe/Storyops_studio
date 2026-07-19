# StoryOps Studio v2.0.0 engineering report

## Executive result

StoryOps Studio — IP Foundry V2 is deployed:

- Frontend: <https://storyops.ukexe06.workers.dev>
- API: <https://storyops-api.ukexe06.workers.dev>
- Database, Auth, and Storage: Supabase project `namuaqfivfwopaqkdjuw`
- Schema head: `7e34a290f9de`
- API Worker version: `d3674f7c-e879-4fd3-a00d-1343d0f05eff`
- Frontend Worker version: `a04fdb03-cf17-43e5-a2b8-9f34feeb1d8b`

Public probes report API v2.0.0, connected Postgres, configured OpenAI
production inference, and explicit deterministic edge fallback.

An authenticated production smoke test verified:

- Project creation and cleanup
- Item creation
- Context-aware console analysis
- Executive impact report generation
- Persisted conversation, workflow run, and three transparent steps
- `openai/gpt-5.6-luna` model audit IDs
- Artifact persistence
- Correlated workspace timeline events
- Temporary user and project cleanup

## Release scope

### Premium product experience

The public homepage is now a self-guided enterprise product demonstration:

- Live runtime status
- Interactive operating-console preview
- Clickable architecture explorer
- Discovery pipeline walkthrough
- Capability explorer with inputs, outputs, models, value, use cases,
  dependencies, architecture, and maturity
- Atlas and event-timeline previews
- Multi-agent operating model
- Explainability and trust contract
- Enterprise integration and roadmap views

Every capability is labelled **Live**, **V2 foundation**, or **Roadmap**.

### AI operating console

`/projects/[id]/console` adds:

- Persistent project conversations
- Page and project context handling
- Deterministic command planning
- Specialist routing
- Bounded workspace snapshots
- Structured OpenAI/Granite-compatible responses
- Explicit deterministic fallback
- Workflow run, progress, confidence, agent, and tool trace
- Reusable executive and architecture artifacts
- UI intents and next-action recommendations

The console exposes objectives, tools, evidence, confidence, progress, model
IDs, and outcomes. It does not claim to expose private chain-of-thought.

### Enterprise workspace timeline

`/projects/[id]/timeline` projects append-only events for:

- Project creation and updates
- Item creation, updates, and deletion
- Analysis completion
- Task updates and deletion
- Demo seeding
- Console start, completion, and failure
- Artifact generation

Events include source, object, actor, model, correlation, causation, payload,
reversibility, and timestamps. Replay planning creates a new console request;
historical events are never edited.

### Data model

Revision `4e0683f5a3ed` adds:

- `conversations`
- `conversation_messages`
- `workflow_runs`
- `workflow_steps`
- `artifacts`
- `workspace_events`

The migration adds:

- Database UUID defaults
- Foreign keys and cascade behavior
- Query-aligned and foreign-key indexes
- Lifecycle, progress, confidence, role, and version constraints
- Updated-at triggers
- RLS on every table
- Revoked `anon` and `authenticated` privileges
- Explicit `service_role` CRUD grants
- Conditional `storyops_app` runtime grants

Revision `7e34a290f9de` enables RLS and revokes public/browser access on
`public.alembic_version`.

Production verification confirmed all V2 tables exist, RLS is enabled, browser
roles lack access, `service_role` has required access, and the `assets` bucket
remains private.

## AI architecture

### Production

The Cloudflare Worker calls the OpenAI Responses API:

- Model: `gpt-5.6-luna`
- Strict structured output
- Text and low-detail vision input
- Bounded content, metadata, output, and deadline
- `store: false`
- No model-side tools
- Server-side specialist and tool selection
- Explicit `openai/<model>` audit IDs
- Deterministic StoryOps fallback

### Canonical IBM path

The FastAPI implementation retains:

- Granite Instruct Brief Agent
- Granite Instruct Script Agent
- Granite Vision Asset Agent
- Deterministic Edit, Feedback, and Performance agents
- Granite-compatible console synthesis
- Bounded concurrent inference and timeouts

This path is implemented but requires valid IBM credentials and a deployed
Python runtime before it can be described as production-active.

## Security result

Implemented controls:

- Supabase JWT validation
- Non-anonymous identity requirement
- Project ownership checks
- Cross-tenant `404` behavior
- RLS-enabled application and control-plane tables
- Revoked browser table access
- Private assets with signed reads
- Image size and magic-byte validation
- Non-asset file rejection in both APIs
- Exact-origin CORS
- Environment-derived CSP connect/image origins
- Production HSTS, frame denial, referrer policy, and permissions policy
- Development-only `unsafe-eval` for React debugging
- Secret-only provider credentials
- OpenAI API storage disabled
- Prompt-injection separation for untrusted creative content
- Sanitized provider and persistence errors
- Git history and dependency scanning

Supabase database advisors report no remaining database security or performance
errors. The only remaining platform warning is **Leaked Password Protection
Disabled**. Supabase exposes this feature on eligible paid plans/entitlements;
enable it in Auth settings when available.

## Reliability improvements

- Edge analysis removes a newly inserted analysis if generated-task inspection
  or insertion fails.
- Latest-analysis ordering is deterministic on timestamp and UUID.
- Item-type changes clear stale upload state.
- Edit/performance metadata is visible on item detail.
- Legacy demo thumbnails render as trusted embedded image data.
- Sign-out failures produce a visible error instead of leaving the header stuck.
- Console failures create failed run and timeline records.
- Event cursor pagination excludes page-boundary duplicates.

## Validation results

### Canonical backend

- Ruff: pass
- Pytest: 38 pass
- Python compilation: pass
- Alembic graph: one head at `7e34a290f9de`
- Full PostgreSQL SQL compilation: pass
- Production migration: pass
- Production RLS/grant/storage assertions: pass

### Edge API

- Vitest: 8 pass
- TypeScript: pass
- Wrangler dry run: pass
- Production deploy: pass
- Public `/`, `/live`, and `/health`: pass
- Authenticated V2 control-plane smoke: pass
- Real OpenAI console analysis: pass
- Real OpenAI executive artifact generation: pass

### Frontend

- ESLint: pass
- Vitest: 3 pass
- Route-aware TypeScript: pass
- Linux OpenNext build in Node 22.13 container: pass
- Static generation for all routes: pass
- Cloudflare asset and Worker deploy: pass
- Public homepage hydration and live status: pass
- Mobile-width overflow check: pass
- Production screenshot capture: pass

The native Windows Next.js builder still encounters an upstream Turbopack
`kill EPERM` process-cleanup issue after successful compilation and TypeScript.
The release artifact was therefore built in a clean Linux Node 22.13 container,
matching GitHub Actions and Cloudflare.

## Public-repository polish

Added or updated:

- Premium root README
- Mermaid runtime, AI sequence, and data-model diagrams
- Detailed IBM Bob lifecycle evidence
- Detailed AI implementation explanation
- Complete environment-variable reference
- Local setup and Cloudflare deployment instructions
- Deployment and rollback runbook
- Security policy
- Contributing guide
- Vector hero artwork
- Production homepage screenshot
- V2 architecture and task tracking
- Release changelog and package versions

## IBM Bob evidence

IBM Bob is documented as the SDLC partner across:

- Problem selection and brainstorming
- Architecture and data modelling
- Dependency-ordered planning
- Frontend, backend, migration, and test generation
- Auth, deployment, storage, and provider debugging
- Refactoring and contract alignment
- UI iteration and accessibility
- Release hardening and documentation

Repository evidence is stored in `.bob/`, `AGENTS.md`, `docs/`, tests, CI, and
release artifacts. Genuine Bob session screenshots or exports remain part of
the final external submission media pack.

## Remaining submission-media work

1. Publish the final demo video or GIF URL.
2. Add genuine IBM Bob session screenshots/exports if required by the challenge.
3. Optionally enable Supabase leaked-password protection on an eligible plan.
4. Optionally deploy the canonical FastAPI/Granite runtime with valid IBM
   credentials.

These are external media, entitlement, or credential gates. The V2 Cloudflare,
Supabase, and OpenAI production workflow is deployed and verified.
