# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

**StoryOps Studio** — an agentic AI creative operations platform built for the IBM AI Builders Challenge (July 2026 theme: *Reimagine Creative Industries with AI*). It turns fragmented creative production workflows (briefs, scripts, assets, edits, feedback) into a unified, insight-driven pipeline built primarily with IBM Bob. OpenAI powers the disclosed live inference path; the canonical FastAPI service retains the watsonx.ai/Granite implementation.

**Status:** StoryOps Studio is live end to end. The Next.js frontend runs at
`https://storyops.ukexe06.workers.dev`, the production REST adapter runs at
`https://storyops-api.ukexe06.workers.dev`, and the Supabase schema, Auth,
private Storage bucket, dashboard, pipeline, analyses, and tasks are verified.
The live adapter uses OpenAI with explicit model IDs and deterministic
edge-agent fallback. The canonical FastAPI service contains the full Granite
integration for future IBM credentials.

## Planned Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React) — deployed to Cloudflare Workers with OpenNext |
| Backend | FastAPI (canonical) + Cloudflare Worker production adapter |
| Database | PostgreSQL via Supabase or IBM Cloud Databases |
| AI/LLM | OpenAI production inference + watsonx.ai/Granite canonical path |
| Orchestration | watsonx Orchestrate / Langflow-style multi-agent graphs |
| CI/CD | GitHub Actions + IBM Bob CLI hooks |

## Intended Repository Structure

```
/frontend   – Next.js app
/backend    – FastAPI service and Cloudflare Worker deployment adapter
/infra      – Deployment configs, CI/CD workflows
/docs       – Architecture, research, Bob usage guide
README.md
```

## IBM Bob Usage Strategy

IBM Bob is the **primary SDLC partner** — not just a code generator. Judges explicitly evaluate visible Bob usage across planning, coding, testing, documentation, and repo workflows.

- **Plan mode** → architecture design, DB schema, orchestration diagrams (store outputs in `/docs/architecture.md`)
- **Agent mode** → scaffold Next.js frontend, FastAPI backend, DB models, multi-agent scaffolding
- **Ask mode** → debug, understand errors, refactor code

## AI Provider Integration

- Production calls the OpenAI Responses API with structured outputs, multimodal
  image input, `store: false`, bounded prompts, and explicit model audit IDs.
- `OPENAI_API_KEY` is a Cloudflare Worker secret and must never enter source,
  documentation, chat, or browser-visible configuration.
- Deterministic rules remain the live fallback and use `storyops/edge-*` IDs.

The canonical FastAPI path retains IBM Granite and watsonx:
- `granite-3-8b-instruct` (or similar Instruct variant) — text reasoning for briefs, scripts, task generation
- Granite Vision model — thumbnail/image analysis for brand consistency checks
- Granite model calls go through **watsonx.ai API** (`https://us-south.ml.cloud.ibm.com`)
- Required env vars: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`

## Core Data Model

```
projects → items (stage is a validated Idea→…→Analyze string constant)
         → analyses (agent_type, summary, recommendations: JSON, score_metrics)
         → tasks (AI-generated, optionally linked to items)
```

## Multi-Agent Pipeline

Six conceptual agents, each triggered by pipeline events:
1. **Brief Agent** — parses briefs into structured objectives/constraints
2. **Script Agent** — analyzes hooks, pacing, narrative arcs
3. **Asset Agent** — multimodal thumbnail and brand/logo consistency analysis
4. **Edit Agent** — timeline metadata (scene lengths, transitions) → retention signals
5. **Performance Agent** — ingests views/retention/CTR to connect pipeline to outcomes
6. **Feedback Agent** — converts reviewer notes into actionable work

## Demo Script (for judging)

1. Create a "YouTube Series" project
2. Upload brief + script → show AI structure/hook analysis
3. Add thumbnails + edit metadata → show OpenAI vision + Edit Agent output
4. Display AI-generated task board and pipeline stage view
5. Show Bob-generated docs/comments in repo

## Key Constraints

- IBM Bob **must be visibly used** as the primary dev tool — judges look for this
- OpenAI is allowed only as a clearly disclosed additional AI provider
- Architecture must emphasize **agentic/multi-agent workflows**, not single prompts
- Keep MVP scope tight: 2–3 agents + manual data ingestion; watsonx Orchestrate is stretch
- Reference `docs/research.md` for full scoring rationale, winning patterns, and idea database
