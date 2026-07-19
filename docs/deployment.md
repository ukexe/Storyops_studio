# StoryOps Studio deployment runbook

This runbook deploys the production Supabase schema, Cloudflare API Worker, and
OpenNext frontend Worker in dependency order.

Production endpoints:

- Frontend: <https://storyops.ukexe06.workers.dev>
- API: <https://storyops-api.ukexe06.workers.dev>
- Health: <https://storyops-api.ukexe06.workers.dev/health>

## Release order

```text
Validate source
  → apply additive database migration
  → deploy API Worker
  → verify public and authenticated API
  → deploy frontend Worker
  → verify complete browser journey
  → publish commit/tag/release evidence
```

Do not deploy the V2 API before all migrations through revision
`7e34a290f9de` are applied.

## 1. Prerequisites

- Node.js 22.13+
- Python 3.11
- npm
- Cloudflare Wrangler 4.x
- Authenticated Cloudflare CLI session
- Supabase migration credentials
- Production Worker secrets already configured or ready to set
- Production Auth redirect URLs configured

Verify tooling:

```bash
node --version
npm --version
python --version
npx wrangler --version
npx wrangler whoami
```

## 2. Source validation

Canonical backend:

```bash
cd backend
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pip_audit -r requirements.txt
python -m ruff check app tests migrations
python -m pytest tests -q -p no:cacheprovider
python -m alembic heads
python -m alembic upgrade head --sql
```

Expected migration head:

```text
7e34a290f9de
```

Edge API:

```bash
cd backend/cloudflare
npm ci
npm audit --audit-level=moderate
npm test
npm run typecheck
npm run dry-run
```

Frontend:

```bash
cd frontend
npm ci
npm audit --audit-level=moderate
npm run lint
npm test
npm run typecheck
```

Run the final OpenNext build in Linux CI or another Linux environment matching
Cloudflare:

```bash
npx opennextjs-cloudflare build
```

The native Windows Next.js builder can report an upstream `kill EPERM` process
cleanup error after successful compilation and TypeScript validation. Do not
replace the Linux release gate with that Windows result.

## 3. Apply the Supabase migration

Configure `backend/.env` with the production migration connection. Use a role
authorized to create tables, indexes, constraints, triggers, grants, and
Storage bucket configuration.

```bash
cd backend
python -m alembic current
python -m alembic heads
python -m alembic upgrade head
python -m alembic current
```

Expected current revision:

```text
7e34a290f9de
```

Verify:

- `conversations`
- `conversation_messages`
- `workflow_runs`
- `workflow_steps`
- `artifacts`
- `workspace_events`
- All foreign-key and query indexes
- Lifecycle and confidence constraints
- RLS enabled on every control-plane table
- `anon` and `authenticated` table privileges revoked
- `service_role` CRUD grants present
- Existing private `assets` bucket remains private

Run Supabase database advisors and resolve security or performance findings
before API deployment.

### Migration rollback policy

Do not automatically downgrade a production Supabase database. Existing
downgrades can weaken Storage posture and remove control-plane history. If the
application release fails:

1. Roll back the Cloudflare Workers.
2. Leave additive tables in place.
3. Prepare a forward corrective migration.

## 4. Configure API Worker secrets

From `backend/cloudflare`:

```bash
npx wrangler secret list
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put OPENAI_API_KEY
```

Do not pass secret values on a shell command line. Wrangler prompts for them
without writing them to source or shell history.

Non-secret production configuration is in `wrangler.jsonc`:

- `SUPABASE_URL`
- `CORS_ORIGINS`
- `OPENAI_MODEL`

Verify the configured CORS origin is exactly:

```text
https://storyops.ukexe06.workers.dev
```

## 5. Deploy the API Worker

```bash
cd backend/cloudflare
npm run dry-run
npm run deploy
```

Record the deployed version ID from Wrangler output.

Public smoke tests:

```bash
curl -i https://storyops-api.ukexe06.workers.dev/live
curl -i https://storyops-api.ukexe06.workers.dev/health
```

Expected health properties:

```json
{
  "status": "ok",
  "database": "connected",
  "analysis_mode": "openai",
  "fallback_mode": "edge-rules"
}
```

`model_id` must identify the explicitly configured model. `openai: configured`
confirms configuration, not a live provider inference.

Authenticated API verification must cover:

- Project list/create/read
- Item creation
- Analysis and generated task persistence
- Console turn
- Workflow run and steps
- Reusable artifact generation
- Workspace event retrieval
- Cross-tenant `404` behavior

## 6. Configure the frontend Worker

Verify `frontend/wrangler.jsonc` contains:

- Production Supabase URL
- Supabase publishable key
- `https://storyops-api.ukexe06.workers.dev/api/v1`

These variables are public by design. No secret may appear in this file.

Generate bindings after configuration changes:

```bash
cd frontend
npm run cf-typegen
```

## 7. Deploy the frontend Worker

```bash
cd frontend
npm run deploy
```

Open:

```text
https://storyops.ukexe06.workers.dev
```

Verify the browser receives:

- Content Security Policy
- HSTS
- Frame denial
- Referrer policy
- Permissions policy
- No secret values in generated JavaScript

## 8. Supabase Auth configuration

Production Auth settings must include:

- Site URL: `https://storyops.ukexe06.workers.dev`
- Redirect URL:
  `https://storyops.ukexe06.workers.dev/auth/confirm`
- Local redirect URL:
  `http://localhost:3000/auth/confirm`

Test a real confirmation email before recording the final demo.

## 9. End-to-end acceptance

Follow [`demo-walkthrough.md`](demo-walkthrough.md):

1. Register or sign in.
2. Verify **OpenAI active**.
3. Seed the judging workspace.
4. Inspect four pipeline items.
5. Open Brief, Script, and Asset analyses.
6. Confirm provider model IDs.
7. Move a generated task to **In progress**.
8. Open the AI console.
9. Generate an executive impact report.
10. Verify the transparent workflow trace.
11. Download or copy the artifact.
12. Open Timeline and inspect correlated events.
13. Sign out and sign back in.
14. Confirm persisted state.

Also verify:

- Mobile viewport does not overflow.
- Keyboard navigation reaches all demo controls.
- Browser console contains no application errors.
- Invalid and cross-tenant IDs do not expose resource existence.
- A deliberate provider failure produces an explicit
  `storyops/control-plane-rules-v1` or `storyops/edge-*` audit ID.

## 10. Observability

After deployment, inspect Workers Logs for:

- Unhandled exceptions
- `openai_analysis_fallback`
- `openai_console_fallback`
- `analysis_compensation_failed`
- Elevated `401`, `429`, or `500` responses

No log should contain creative content, JWTs, secrets, database URLs, or image
bytes.

## 11. Cloudflare rollback

List versions:

```bash
npx wrangler versions list
```

Roll back the affected Worker:

```bash
npx wrangler rollback
```

Rollback order:

1. Frontend Worker if the UI contract is incompatible.
2. API Worker if server behavior is faulty.
3. Keep additive schema changes and issue a forward migration.

Re-run health and authenticated smoke tests after rollback.

## 12. Release evidence

Preserve:

- Commit SHA
- Migration revision
- API and frontend Worker version IDs
- GitHub Actions URLs
- Public health response
- Screenshot of the homepage
- Screenshot of the console run trace
- Screenshot of the workspace timeline
- Real model audit IDs
- IBM Bob session screenshots or exports
- Final demo video/GIF URL
