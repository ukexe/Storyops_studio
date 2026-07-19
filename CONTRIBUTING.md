# Contributing to StoryOps Studio

Thank you for helping improve StoryOps Studio and the StoryOps intelligence control plane.

## Before you begin

- Read [`AGENTS.md`](AGENTS.md) for load-bearing project constraints.
- Read [`docs/architecture.md`](docs/architecture.md) for the current runtime.
- Read
  [`docs/storyops-v2-control-plane-architecture.md`](docs/storyops-v2-control-plane-architecture.md)
  before changing conversations, runs, artifacts, events, AI tools, or future
  knowledge-graph features.
- Open an issue before starting a large architecture, schema, provider, or UX
  change.

## Development setup

Follow the complete [README setup guide](README.md#getting-started).

Minimum supported runtimes:

- Python 3.11
- Node.js 22.13+
- npm
- PostgreSQL through Supabase for full integration testing

Never commit `.env`, `.env.local`, `.dev.vars`, credentials, access tokens,
private creative material, or production database exports.

## Branches and commits

Create a focused branch from `main`:

```bash
git checkout -b feat/short-description
```

Use concise commit messages consistent with the repository:

```text
feat: add approval-aware workflow step
fix: prevent stale asset upload on type change
docs: clarify production deployment order
test: cover cross-tenant artifact access
```

Keep unrelated refactors out of feature commits.

## Code standards

### Python

- Use Python 3.11 syntax and SQLAlchemy 2 typed mappings.
- Keep Pydantic contracts strict and bounded.
- Preserve `404` behavior for missing and cross-tenant resources.
- Keep provider exceptions and database details out of client responses.
- Record model and ruleset audit IDs.
- Do not perform external model calls while holding a database transaction.

Validate:

```bash
cd backend
python -m ruff check app tests migrations
python -m pytest tests -q -p no:cacheprovider
```

### TypeScript and React

- Keep strict TypeScript enabled.
- Use Server Components by default and isolate client interactivity.
- Reuse the typed API boundary in `frontend/lib/api.ts`.
- Provide loading, empty, error, keyboard, and reduced-motion behavior.
- Do not expose server secrets through `NEXT_PUBLIC_*`.
- Clearly label roadmap-only product experiences.

Validate:

```bash
cd frontend
npm run lint
npm test
npm run typecheck
npm run cf-typecheck
npm run build:worker
npm run dry-run
```

### Cloudflare Worker

- Validate auth and project ownership before every data operation.
- Await every promise.
- Keep model inputs and outputs bounded.
- Use structured, redacted logs.
- Preserve explicit provider and fallback IDs.
- Run a Wrangler dry run before deployment.

Validate:

```bash
cd backend/cloudflare
npm test
npm run typecheck
npm run cf-typecheck
npm run dry-run
```

## Database changes

Alembic is the sole schema authority. Do not introduce a parallel Supabase
migration history.

1. Generate one descriptive Alembic revision.
2. Add indexes for every foreign key and expected access path.
3. Add database constraints for lifecycle values and integrity rules.
4. Enable RLS and explicitly configure table grants.
5. Keep `anon` and `authenticated` roles away from backend-only tables.
6. Update SQLAlchemy models and API contracts.
7. Add ownership, migration, and failure-path tests.
8. Compile the full migration chain:

```bash
cd backend
python -m alembic heads
python -m alembic upgrade head --sql
```

Production migrations must use expand/backfill/contract sequencing for
incompatible changes.

## AI and agent changes

Every AI capability must define:

- Purpose and supported inputs
- Typed output contract
- Input and output bounds
- Model/provider audit ID
- Deterministic or explicit failure behavior
- Prompt-injection boundary
- Evidence and confidence handling
- Mutation policy and human approval requirements
- Tests for refusal, malformed output, timeout, and fallback

Do not describe a dispatcher as agent-to-agent orchestration. Do not expose
private model chain-of-thought. Show objectives, tools, dependencies, evidence,
progress, failures, and outcomes instead.

## Pull request checklist

- [ ] Change is focused and documented.
- [ ] No secrets or private user data are present.
- [ ] Frontend lint, tests, and typecheck pass.
- [ ] FastAPI lint and tests pass.
- [ ] Edge tests, typecheck, and dry-run pass.
- [ ] Migration graph and offline SQL compile pass when schema changed.
- [ ] Ownership and cross-tenant behavior are tested.
- [ ] New UI includes loading, empty, error, and keyboard states.
- [ ] New AI output records model/ruleset provenance.
- [ ] README, architecture, demo, or deployment docs are updated when needed.

## Security reports

Do not open public issues for vulnerabilities. Follow [`SECURITY.md`](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the
project's [MIT License](LICENSE).
