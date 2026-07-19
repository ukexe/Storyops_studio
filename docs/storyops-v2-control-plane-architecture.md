# StoryOps V2 control-plane architecture

> Status: v2.1.0 control-plane foundation deployed and production-verified on
> July 19, 2026. Production schema head: `73ff11ca1f26`.

## Architectural decision

The repository is not an existing creative-intelligence platform. Before this work it
implemented StoryOps Studio: an authenticated creative-production pipeline with
four application tables, synchronous item analysis, six item-type analyzers,
private image storage, generated tasks, and a production Cloudflare adapter.

Replacing that product wholesale would discard the strongest challenge
narrative and a working production system. StoryOps Studio is therefore introduced
as the reusable intelligence and control plane beneath StoryOps:

```text
StoryOps creative workflow (first vertical)
                  │
                  ▼
StoryOps intelligence control plane
  conversations · runs · steps · artifacts · events
                  │
                  ▼
Future creative intelligence roadmap
  sources · chunks · embeddings · patterns · graph · impact
```

This preserves the creative-industries use case while creating the primitives
needed for discovery, explainability, conversational control, and future
vertical workflows.

## Current-state findings

### Implemented before V2

- Public landing page and Supabase email/password authentication
- Project dashboard and idempotent judging demo
- Fixed `Idea → Script → Assets → Edit → Feedback → Publish → Analyze` board
- Text, image, edit-metadata, feedback, and performance-metric ingestion
- Item detail with structured model analysis
- Generated task board with persisted status changes
- Canonical FastAPI/watsonx.ai implementation
- Production Cloudflare/OpenAI implementation with deterministic fallback
- Supabase Postgres, Auth, private Storage, ownership checks, and RLS hardening
- CI, dependency audits, deployment configuration, and production health probes

### Material gaps found by the architecture audit

- No conversation or session memory
- No central planner or typed tool registry
- No agent-to-agent delegation
- No durable job, run, step, pause, resume, retry, or approval state
- No event ledger, replay, undo receipt, or activity projection
- No reusable artifact model
- No source chunks, embeddings, semantic search, duplicate detection, or graph
- No repository generator, Knowledge map, impact report, or enterprise integration
- Synchronous inference and process-local rate limiting
- Production Worker logic concentrated in one large route module
- FastAPI and Worker behavior duplicated without a generated shared contract
- No organization, membership, or role model beyond project ownership

## Judge-level assessment

| Dimension | Pre-V2 assessment | Evidence |
|---|---:|---|
| Innovation | 6.5/10 | Specialized creative analyzers are differentiated, but do not collaborate. |
| Enterprise usefulness | 5.5/10 | Real auth, tenancy, persistence, and private assets; no RBAC, approvals, integrations, or replay. |
| Technical execution | 7.5/10 | Deployed dual-runtime architecture with model and deterministic paths. |
| AI sophistication | 4.5/10 | Structured text and vision calls, but no planner, tools, memory, evidence model, or delegation. |
| Architecture maturity | 5.5/10 | Strong MVP security; synchronous and duplicated service logic constrain growth. |
| Scalability | 4/10 | No pagination on legacy collections, durable jobs, or distributed rate limits. |
| UX maturity | 5.5/10 | Accessible core states, but page-centric and visually generic. |
| Demo impact | 6/10 | Reliable seeded workflow, but the old homepage understated the engineering. |

## V2 experience architecture

### Public product experience

`frontend/components/marketing/StoryOpsExperience.tsx` replaces the generic
commercial landing page with a self-guided technical product experience:

- Live production health and model status
- Interactive AI Asset Studio command preview
- Clickable architecture explorer
- Animated seven-stage creative workflow
- Capability explorer with purpose, inputs, outputs, models, business value,
  enterprise uses, examples, architecture, dependencies, and maturity
- Clearly marked roadmap knowledge-map preview
- Implemented specialist-routing model
- Explainability contract
- Enterprise integration map
- Honest `Live`, `V2 foundation`, and `Roadmap` labels

The public page never claims that roadmap-only capabilities are deployed.

### Authenticated AI Asset Studio

Route: `/projects/[id]/console`

The console is a context-aware control-plane foundation rather than a detached
chat widget. A turn receives:

```json
{
  "message": "Generate an executive impact report.",
  "conversation_id": "optional UUID",
  "replay_from_run_id": "optional UUID",
  "replay_from_event_id": "optional UUID",
  "context": {
    "current_page": "/projects/<id>/console",
    "selected_project_id": "<id>",
    "inspector_tab": "run"
  }
}
```

Each turn:

1. Verifies project ownership.
2. Creates or resumes a durable conversation.
3. Persists the user message.
4. Creates a workflow run with an objective and current agent.
5. Appends a correlated `console.turn.started` event.
6. Builds a bounded workspace snapshot from items, analyses, tasks, recent
   messages, artifacts, and optional persisted replay evidence.
7. Selects a specialist and typed local tools from the user command.
8. Calls the configured model with structured output.
9. Falls back to an explicitly audited deterministic control-plane response.
10. Persists transparent workflow steps and tool receipts.
11. Persists the assistant message.
12. Creates a reusable document, Mermaid diagram, code asset, JSON contract,
    analytic visual, or private generated image when requested.
13. Completes the run and appends correlated completion/artifact events.

The UI exposes objective, progress, specialist, tools, confidence, model ID,
artifacts, recommended actions, and timeline events. It does not expose private
chain-of-thought.

### Implemented asset and command classes

| Asset class | Specialist | Durable output |
|---|---|---|
| Workspace analysis, confidence, bottlenecks, replay comparison | Analysis specialist | Grounded response, actions, and trace |
| PRDs, specifications, stories, SOPs, release notes, project plans | Technical Writer | Rich Markdown document |
| Architecture, sequence, data-flow, ER, workflow, Gantt, KPI, and burndown visuals | Diagram Architect / Analytics Designer | Rendered Mermaid with SVG export |
| SQL, OpenAPI, JSON Schema, and TypeScript contracts | Engineering Writer | Syntax-highlighted downloadable code |
| Roadmaps, sprint plans, risk, personas, journeys, and metrics | Product Strategist | Product strategy document |
| Executive, ROI, market, pitch, and value-proposition work | Impact Analyst | Business document |
| Landing, blog, launch, social, email, ad, and SEO copy | Marketing Writer | Marketing content package |
| Illustrations, storyboards, concepts, logos, covers, banners, thumbnails, and social graphics | Visual Designer | Private generated image |
| Open tasks, pipeline, or timeline | Workspace Navigator | Valid internal navigation intent |

Mutating model tools, approvals, pause/resume, durable background execution,
and collaborative editing remain future control-plane work.

## Data architecture

Alembic revision `4e0683f5a3ed` adds six control-plane tables.

### `conversations`

- Project and owner scope
- Durable title and lifecycle status
- Last known UI/context snapshot
- Created and updated timestamps

### `conversation_messages`

- User, assistant, tool, and system roles
- Optional workflow-run link
- Specialist and model audit IDs
- Transparent tool-call receipts
- Extensible metadata

### `workflow_runs`

- Objective and run type
- Queued, running, paused, approval, completed, failed, and cancelled states
- Progress, current agent, confidence, model, prompt version, context, error,
  timing, and optional replay-source run

### `workflow_steps`

- Stable sequence per run
- Specialist and tool identity
- Input/output summaries
- Dependencies, confidence, state, and timing

### `artifacts`

- Project, conversation, source-message, and run lineage
- Type, title, content, format, MIME type, status, and version
- Private generated-media object path and signed response URL
- Model, content hash, confidence, prompt version, and source snapshot

### `workspace_events`

- Application append-only user, agent, tool, workflow, and system events
- Project, run, artifact, object, actor, and causation links
- Correlation ID spanning a complete request
- Human-readable title and summary
- Typed payload, model audit ID, and reversibility marker

All foreign keys used for joins and cascading cleanup are indexed. Database
constraints protect lifecycle values, sequence, progress, confidence, and
artifact versions. Browser roles receive no table privileges. The backend
`service_role` receives explicit grants for PostgREST compatibility after the
Supabase 2026 Data API grant change. Revision `73ff11ca1f26` restricts runtime
event access to insert and read; project deletion remains the governed purge
boundary. The optional `storyops_app` role receives the same scoped behavior.

## Enterprise workspace timeline

Route: `/projects/[id]/timeline`

The timeline projects application append-only domain and control-plane events
into a searchable workspace history retained for the life of a project.
Implemented event producers include:

- `project.created`
- `project.updated`
- `item.created`
- `item.updated`
- `item.deleted`
- `analysis.completed`
- `task.updated`
- `task.deleted`
- `demo.seeded`
- `console.turn.started`
- `console.turn.completed`
- `console.turn.failed`
- `artifact.created`

Updates record changed fields and safe scalar/hash summaries rather than
duplicating full creative content. A replay request does not mutate history. It
creates a new run with `replayed_from_run_id`, links its start event to the
selected source event, and supplies the original run, steps, events, artifacts,
and current evidence to the specialist.

Full automatic replay and compensating execution require a future action-receipt
and approval service.

## Explainability contract

Every future recommendation, candidate, graph relationship, generated
repository, and impact score must carry:

- Source IDs and source versions
- Evidence locations or graph paths
- Agent and tool identity
- Provider and model audit ID
- Prompt or policy version
- Confidence factors, contradictions, freshness, and coverage
- Correlation and causation IDs
- Human approval or override when applicable
- Usage and latency observations for model-backed work

The product may show objectives, plans, selected tools, dependencies, progress,
intermediate artifacts, failures, retries, and outcomes. It must not claim to
show private model chain-of-thought.

## Target runtime architecture

```text
Next.js experience
  ├─ Command palette and floating/contextual console access
  ├─ Chat, run trace, artifact shelf, Knowledge map, analytics, and timeline
  └─ Typed REST/WebSocket client
            │
            ▼
Authenticated edge API
  ├─ Supabase session validation and project ownership
  ├─ Control-plane REST contract
  ├─ Provider adapter and deterministic fallback
  └─ Append-only event producer
            │
            ├──────────────► Supabase Postgres + private Storage
            │
            ▼
Future real-time Agent session
  ├─ Durable identity and conversation state
  ├─ Client synchronization and resumable streaming
  └─ Typed tool and approval gateway
            │
            ▼
Future durable Workflow execution
  ├─ Retryable extraction, embedding, discovery, and generation
  ├─ Pause/resume and human-in-the-loop approvals
  └─ Step checkpoints and failure recovery
```

Cloudflare Agents are suitable for persistent real-time workspace sessions.
Cloudflare Workflows are suitable for long-running, retryable execution.
Supabase remains the cross-runtime source of truth and audit store. The
canonical FastAPI path preserves Granite and can execute the same REST contract.

## Future creative intelligence roadmap

The homepage labels these capabilities as roadmap until their data, execution,
tests, and evidence are real:

1. `sources` and `source_versions`
2. `source_chunks` with parser and location metadata
3. Embedding jobs and vector records
4. Authorized hybrid semantic search
5. `patterns`, `candidates`, and evidence links
6. Duplicate detection and similarity clustering
7. `knowledge_nodes` and `knowledge_edges`
8. Knowledge map graph projection and relationship prediction
9. Repository manifests and sandboxed generation
10. Impact reports, metric observations, assumptions, and sensitivity ranges
11. Workspace memberships, roles, policies, approvals, and quotas
12. Distributed rate limiting, pagination, cost telemetry, and SLO alerting

## Delivery order

```text
Interactive product experience
  → event/artifact/conversation/run primitives
  → central AI Asset Studio
  → timeline and replay planning
  → durable Agent + Workflow runtime
  → source parsing and embeddings
  → pattern intelligence and Knowledge map
  → governed repository generation
  → impact forecasting and enterprise integrations
```

This order prevents the product from presenting static mock screens as
implemented AI capabilities. Every new vertical slice must include durable
state, real execution, evidence, tests, UI, and demo acceptance criteria.

## Production rollout verification

Completed for v2.1.0:

1. Applied migrations through `73ff11ca1f26`.
2. Ran database advisors and verified constraints, indexes, RLS, browser-role
   revocations, backend grants, and private Storage.
3. Deployed API Worker version `fc45b72e-e5c0-4cb5-9fa4-764a7dcb9a67`.
4. Built OpenNext in Linux and deployed frontend Worker version
   `4e536aff-efff-4e6f-8aaf-6b3b1bd2ef26`.
5. Verified project and item event creation against production.
6. Verified real OpenAI Asset Studio analysis and executive artifact generation.
7. Verified ownership tests, cursor pagination, deep links, and public mobile
   layout.
8. Updated the demo, deployment, README, and release documentation.

Remaining operational work:

- Add authenticated browser E2E coverage for artifact download and replay.
- Add cost, latency, error, fallback, and SLO dashboards.
- Enable Supabase leaked-password protection when the project plan exposes the
  required entitlement.
