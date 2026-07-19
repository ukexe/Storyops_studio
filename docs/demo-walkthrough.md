# StoryOps Studio demo walkthrough

This walkthrough is the release acceptance path and the recommended
three-minute judging demo for StoryOps Studio.

## Before the demo

Confirm the deployed environment:

1. Open the backend `/live` endpoint and verify HTTP `200`.
2. Open the backend `/health` endpoint and verify:
   - HTTP `200`
   - `status` is `ok`
   - `database` is `connected`
   - `analysis_mode` is `openai` on the live adapter
   - `model_id` identifies the configured OpenAI model
3. Open the frontend landing page.
4. Confirm the frontend deployment URL and `/auth/confirm` are allowed Supabase
   Auth redirect URLs.
5. Confirm the Supabase `assets` bucket exists and is private.
6. Confirm Alembic reports revision `b91f4d8a2c10`.

For local testing, use `http://localhost:3000` and
`http://localhost:8000`. The deployed frontend is
`https://storyops.ukexe06.workers.dev`; the live API is
`https://storyops-api.ukexe06.workers.dev`.

## Demo story

> A small YouTube team has strong creative ideas but loses time coordinating
> briefs, scripts, thumbnails, review notes, and follow-up work. StoryOps turns
> that scattered process into one AI-assisted production pipeline.

## Walkthrough

### 1. Sign in

Open StoryOps Studio and sign in with a confirmed Supabase account.

Expected:

- The dashboard loads without a redirect loop.
- The user email appears in the header.
- The status badge reports **OpenAI active**.

### 2. Seed the judging project

Select **Seed demo**.

Expected:

- The button remains disabled while three AI agents run.
- StoryOps redirects to **YouTube Series — AI Explained**.
- Repeated seed requests return the existing demo project for that user rather
  than generating duplicates.

### 3. Review the pipeline

Show the seven fixed stages:

```text
Idea → Script → Assets → Edit → Feedback → Publish → Analyze
```

Expected demo items:

- Video Brief — Script stage
- Script Draft v1 — Script stage
- Thumbnail v1 — Assets stage
- Director Notes — Feedback stage

The first three items should show completed analysis indicators.

### 4. Open the brief analysis

Open **Video Brief**.

Show:

- Original creative brief
- Brief Agent summary
- Clarity score
- Missing-information recommendations
- Explicit `openai/<model>` audit ID

Explain that the agent converts ambiguity into structured production work
instead of generating the creative concept.

### 5. Open the script analysis

Return to the pipeline and open **Script Draft v1**.

Show:

- Script source
- Hook strength
- CTA presence
- Retention risk
- Pacing and improvement recommendations

OpenAI model output is nondeterministic. Edge fallback output is deterministic;
demonstrate the recommendation structure rather than promising an exact task
count.

### 6. Open the asset analysis

Open **Thumbnail v1**.

Show:

- Image preview
- Brand consistency score
- Logo integrity result
- Visual issue recommendations

Explain that user uploads are private Supabase objects served with signed URLs.
The production API downloads trusted bytes and sends a low-detail image input
to the OpenAI Responses API with storage disabled.

### 7. Show generated tasks

Return to the pipeline and select **Tasks**.

Expected:

- AI recommendations appear in **To do**.
- Priority is visible as text and color.
- Linked item names navigate back to their source item.
- Todo, In progress, and Done columns are responsive.

### 8. Move a task

Move one task from **To do** to **In progress**.

Expected:

- The card moves immediately.
- Only that card's controls are disabled while saving.
- Refreshing the page preserves the new status.

### 9. Operate the workspace through AI

Return to the pipeline and select **AI console**.

Use:

```text
Generate an executive impact report.
```

Show:

- The persisted conversation
- Current objective and completed run
- Context, evidence, and artifact-writer tool receipts
- Impact Analyst delegation
- Confidence and explicit `openai/<model>` audit ID
- Reusable executive report in the artifact shelf

Explain that the chat is not a detached chatbot: one request creates a
conversation message, workflow run, transparent steps, artifact, and correlated
timeline events.

### 10. Replay the workflow evidence

Select **Timeline**.

Show:

- Project and item creation events
- Console start/completion events
- Artifact generation event
- Correlation IDs and model audit metadata
- Reversible update receipts
- **Create replay plan** on a workflow event

Explain that replay prepares a new, reviewable run against current evidence; it
never edits historical events.

### 11. Close the story

Summarize the loop:

```text
Creative input → specialized analysis → structured recommendation
→ team task → operating-console synthesis → reusable artifact
→ explainable timeline → future performance learning
```

Conclude that StoryOps uses AI to protect creative quality and reduce
coordination overhead while humans retain creative judgment.

## Optional manual flow

To demonstrate authoring rather than seeding:

1. Create a project from the dashboard.
2. Add a text brief to the Idea or Script stage.
3. Open the item and select **Analyze item**.
4. Add a JPEG or PNG asset under 10 MB.
5. Run Asset analysis.
6. Open the task board and update a generated task.

## Acceptance checklist

- [ ] Registration and email confirmation work.
- [x] Protected deep links return to their original destination after login.
- [x] Dashboard project counts are correct.
- [x] Backend health reports connected production data and active analysis mode.
- [x] Demo seed is authenticated and idempotent.
- [x] Four demo items render in the expected stages.
- [x] Brief, Script, and Asset analyses render without polling.
- [x] Private asset uploads return working signed previews.
- [x] Generated tasks include linked item titles.
- [x] Task status changes persist after reload.
- [x] Production console analysis uses the configured OpenAI model.
- [x] Executive report generation persists an artifact and three workflow steps.
- [x] Workspace timeline records correlated project, item, console, and artifact events.
- [ ] Mobile layouts do not overflow.
- [ ] Keyboard navigation reaches all demo controls.
- [ ] No browser console errors occur.

## Troubleshooting

### Dashboard redirects to login repeatedly

- Confirm the frontend and Supabase project URLs match.
- Confirm the deployed `/auth/confirm` URL is allowed in Supabase Auth.
- Clear stale browser cookies and sign in again.

### API requests return `401`

- Confirm the frontend sends the current Supabase access token.
- Confirm backend `SUPABASE_URL` matches the frontend project.
- Confirm the JWT signing algorithm is RS256 or ES256.

### An analysis shows a `storyops/edge-*` model ID

- Confirm `OPENAI_API_KEY` exists in the `storyops-api` Worker secrets.
- Verify `/health` reports `analysis_mode: "openai"`.
- Confirm `OPENAI_MODEL` names a model available to the OpenAI project.
- Review structured Worker logs for `openai_analysis_fallback`; logs contain no
  creative content or credentials.

### Asset upload or preview fails

- Confirm the private `assets` bucket exists.
- Confirm the file is a valid JPEG, PNG, GIF, or WebP image under 10 MB.
- Confirm `NEXT_PUBLIC_SUPABASE_URL` was present during the frontend build.

### Backend health returns `503`

- Confirm `DATABASE_URL` uses the Supabase session pooler on port `5432`.
- Apply `python -m alembic upgrade head`.
- Verify the database allows the Render service to connect.

## Recording guidance

- Keep the final video at or below the competition time limit.
- Show the browser and repository artifacts, especially IBM Bob rules,
  architecture, tests, and CI.
- Do not display secret keys, database URLs, or access tokens.
- Record real model responses and describe natural output variation.
