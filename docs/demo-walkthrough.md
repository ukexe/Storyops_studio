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
   - `watsonx` is `connected`
3. Open the frontend landing page.
4. Confirm the frontend deployment URL and `/auth/confirm` are allowed Supabase
   Auth redirect URLs.
5. Confirm the Supabase `assets` bucket exists and is publicly readable.
6. Confirm Alembic reports revision `a4b7c2d9e001`.

For local testing, use `http://localhost:3000` and
`http://localhost:8000`. The deployed frontend is
`https://storyops.ukexe06.workers.dev`; full dashboard workflows also require
the production FastAPI URL.

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
- The watsonx badge reports a connected state.

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
- Fully qualified Granite model ID

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

Model output is nondeterministic. Demonstrate the presence and structure of
useful recommendations rather than promising an exact score or task count.

### 6. Open the asset analysis

Open **Thumbnail v1**.

Show:

- Image preview from Supabase Storage
- Granite Vision brand consistency score
- Logo integrity result
- Visual issue recommendations

Explain that image bytes are fetched only from the configured StoryOps Storage
bucket and sent to watsonx.ai through the centralized client.

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

### 9. Close the story

Summarize the loop:

```text
Creative input → specialized analysis → structured recommendation
→ team task → completed work → future performance learning
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
- [ ] Protected deep links return to their original destination after login.
- [ ] Dashboard project counts are correct.
- [ ] Backend health reports database and watsonx connectivity.
- [ ] Demo seed is authenticated and idempotent.
- [ ] Four demo items render in the expected stages.
- [ ] Brief, Script, and Asset analyses render without polling.
- [ ] Asset preview loads from the `assets` bucket.
- [ ] Generated tasks include linked item titles.
- [ ] Task status changes persist after reload.
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

### Demo seed returns `502`

- Check `WATSONX_API_KEY`, project ID, region, and model entitlement.
- Verify `/health` reports watsonx as connected.
- Check that the Granite text and vision model IDs are available in the
  configured region.

### Asset upload or preview fails

- Confirm the public `assets` bucket exists.
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
