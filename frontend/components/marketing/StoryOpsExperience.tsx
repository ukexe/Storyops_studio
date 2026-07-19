"use client"

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cloud,
  Code2,
  Command,
  Database,
  FileSearch,
  FileText,
  FileUp,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  MessageSquare,
  Network,
  PackageCheck,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getHealth } from "@/lib/api"
import type { HealthResponse } from "@/types"

import styles from "./StoryOpsExperience.module.css"

type CapabilityStatus = "Live" | "V2 foundation" | "Roadmap"
type CapabilityCategory =
  | "Ingest"
  | "Intelligence"
  | "Generate"
  | "Operate"

interface Capability {
  id: string
  title: string
  category: CapabilityCategory
  status: CapabilityStatus
  icon: LucideIcon
  purpose: string
  inputs: string
  outputs: string
  models: string
  businessValue: string
  enterpriseUse: string
  example: string
  architecture: string
  stage: string
  dependencies: string
}

interface ArchitectureLayer {
  id: string
  name: string
  label: string
  status: CapabilityStatus
  icon: LucideIcon
  description: string
  responsibilities: string[]
  dependencies: string
}

interface ConsoleScenario {
  command: string
  objective: string
  agents: string[]
  tools: string[]
  result: string
  artifact: string
}

const CAPABILITIES: Capability[] = [
  {
    id: "upload",
    title: "Upload Engine",
    category: "Ingest",
    status: "Live",
    icon: FileUp,
    purpose: "Bring text and private visual assets into an owned workspace.",
    inputs: "Briefs, scripts, review notes, images, guided scene timing, and performance metrics.",
    outputs: "Validated items, private object paths, signed previews, and typed metadata.",
    models: "No model at ingestion; content remains bounded and validated before analysis.",
    businessValue: "Replaces scattered handoffs with one governed intake boundary.",
    enterpriseUse: "Campaign intake, creative QA queues, agency review, and production evidence capture.",
    example: "A private thumbnail and its launch script become linked pipeline records.",
    architecture: "Next.js multipart client → authenticated Worker/FastAPI → private Supabase Storage and Postgres.",
    stage: "Capture",
    dependencies: "Supabase Auth, private Storage bucket, image magic-byte validation, ownership checks.",
  },
  {
    id: "documents",
    title: "Document Intelligence",
    category: "Intelligence",
    status: "Roadmap",
    icon: FileSearch,
    purpose: "Turn long-form source material into structured, evidence-addressable knowledge.",
    inputs: "Uploaded documents, scripts, briefs, repository docs, and reviewer notes.",
    outputs: "Sections, claims, entities, constraints, gaps, and source references.",
    models: "Granite Instruct or the disclosed production text model, with deterministic validation.",
    businessValue: "Cuts manual reading time while preserving provenance for review.",
    enterpriseUse: "Requirements mining, policy analysis, campaign discovery, and institutional knowledge capture.",
    example: "Extract three objectives, two constraints, and a missing approval requirement with citations.",
    architecture: "Source parser → bounded chunks → extraction agent → typed records → evidence links.",
    stage: "Understand",
    dependencies: "Source records, chunking, artifact versioning, model audit IDs, evidence schema.",
  },
  {
    id: "patterns",
    title: "Pattern Discovery",
    category: "Intelligence",
    status: "Roadmap",
    icon: GitBranch,
    purpose: "Identify repeatable methods, components, decisions, and workflows across sources.",
    inputs: "Extracted knowledge, repository structure, outcomes, and semantic neighborhoods.",
    outputs: "Candidate patterns with novelty, reuse, confidence, and supporting evidence.",
    models: "Embedding model for retrieval plus Granite reasoning for synthesis and critique.",
    businessValue: "Converts one-off work into reusable organizational intellectual property.",
    enterpriseUse: "Discover reusable APIs, campaign playbooks, design patterns, and operating procedures.",
    example: "A repeated approval workflow becomes a reusable delivery pattern with four evidence links.",
    architecture: "Embeddings + similarity graph → clustering → discovery agent → confidence calibration.",
    stage: "Discover",
    dependencies: "Document intelligence, embedding pipeline, graph records, scoring rubric.",
  },
  {
    id: "knowledge",
    title: "Knowledge Extraction",
    category: "Intelligence",
    status: "V2 foundation",
    icon: BrainCircuit,
    purpose: "Normalize unstructured material into facts the platform can reason over.",
    inputs: "Text, metadata, images, analyses, tasks, and human decisions.",
    outputs: "Entities, relationships, recommendations, scores, and reusable task drafts.",
    models: "Granite text and vision in the canonical path; structured OpenAI text and vision in production.",
    businessValue: "Creates machine-usable context without discarding human-readable source material.",
    enterpriseUse: "Creative QA, operational review, architecture mining, and portfolio intelligence.",
    example: "A script becomes hook strength, CTA presence, retention risk, and linked recommendations.",
    architecture: "Typed agent contract → strict output validation → atomic analysis and task persistence.",
    stage: "Understand",
    dependencies: "Provider adapters, dispatcher, schema validation, transaction boundary.",
  },
  {
    id: "classification",
    title: "AI Classification",
    category: "Intelligence",
    status: "Roadmap",
    icon: Boxes,
    purpose: "Route unknown material to the right domain, workflow, and specialist agent.",
    inputs: "Source content, mime type, metadata, workspace taxonomy, and user context.",
    outputs: "Document class, sensitivity, domain, workflow route, and confidence factors.",
    models: "Small Granite classifier with deterministic policy checks and human correction.",
    businessValue: "Removes manual triage and improves automation quality at scale.",
    enterpriseUse: "Mixed document intake, multi-team knowledge hubs, and compliance-aware routing.",
    example: "An uploaded PDF is classified as architecture evidence and routed to extraction plus security review.",
    architecture: "Classifier → policy engine → route decision → event receipt → optional approval.",
    stage: "Route",
    dependencies: "Taxonomy, policy rules, confidence schema, correction feedback loop.",
  },
  {
    id: "embeddings",
    title: "Embedding Pipeline",
    category: "Intelligence",
    status: "Roadmap",
    icon: Network,
    purpose: "Build the semantic substrate for retrieval, clustering, and duplicate detection.",
    inputs: "Versioned source chunks, artifacts, pattern descriptions, and repository manifests.",
    outputs: "Vector records, embedding audit metadata, and freshness state.",
    models: "Enterprise embedding model selected through a provider adapter.",
    businessValue: "Makes institutional knowledge discoverable by meaning rather than filenames.",
    enterpriseUse: "Cross-repository discovery, duplicate work detection, and evidence-grounded chat.",
    example: "Two differently named playbooks are recognized as 91% semantically overlapping.",
    architecture: "Chunk queue → embedding batcher → vector store → freshness and lineage checks.",
    stage: "Index",
    dependencies: "Chunking, pgvector or managed vector index, retryable jobs, model versioning.",
  },
  {
    id: "search",
    title: "Semantic Search",
    category: "Intelligence",
    status: "Roadmap",
    icon: Search,
    purpose: "Find reusable knowledge across projects, formats, and naming conventions.",
    inputs: "Natural-language query, filters, current selection, and workspace permissions.",
    outputs: "Ranked evidence, related patterns, source previews, and explanation of relevance.",
    models: "Embedding retrieval with optional Granite reranking and answer synthesis.",
    businessValue: "Reduces repeated work and increases reuse of approved internal assets.",
    enterpriseUse: "Architecture lookup, policy discovery, campaign reuse, and onboarding.",
    example: "Find every proven onboarding pattern used in high-retention projects.",
    architecture: "Authorized query → hybrid retrieval → rerank → evidence bundle → answer agent.",
    stage: "Retrieve",
    dependencies: "Embeddings, keyword index, tenant filters, evidence links, access policy.",
  },
  {
    id: "repository",
    title: "Repository Generator",
    category: "Generate",
    status: "Roadmap",
    icon: Code2,
    purpose: "Package validated knowledge into a governed, reviewable repository.",
    inputs: "Approved patterns, architecture decisions, requirements, templates, and policies.",
    outputs: "Repository tree, code, tests, documentation, CI, deployment plan, and manifest.",
    models: "Granite Code with architecture, security, documentation, and review agents.",
    businessValue: "Turns knowledge into an adoptable asset instead of another static report.",
    enterpriseUse: "Starter kits, reference implementations, internal platforms, and reusable accelerators.",
    example: "Generate a service starter with API contracts, tests, threat notes, and adoption guidance.",
    architecture: "Plan → architecture approval → sandboxed generation → reviews → signed artifact bundle.",
    stage: "Package",
    dependencies: "Pattern approval, artifact store, sandbox, policy gates, code review, export service.",
  },
  {
    id: "knowledge-map",
    title: "Project Knowledge Map",
    category: "Intelligence",
    status: "Roadmap",
    icon: Globe2,
    purpose: "Expose how sources, patterns, agents, repositories, decisions, and outcomes connect.",
    inputs: "Knowledge entities, evidence links, workflow events, repository metadata, and metrics.",
    outputs: "Interactive graph, neighborhoods, dependency paths, gaps, and predicted relationships.",
    models: "Graph enrichment and relationship prediction with evidence thresholds.",
    businessValue: "Makes hidden dependencies and reuse opportunities visible to decision makers.",
    enterpriseUse: "Portfolio rationalization, architecture governance, lineage, and merger discovery.",
    example: "Trace an executive recommendation back through a pattern to three source documents.",
    architecture: "Graph projection over relational records → enrichment jobs → permission-aware explorer.",
    stage: "Explore",
    dependencies: "Stable entity IDs, edge taxonomy, provenance, graph layout, tenant authorization.",
  },
  {
    id: "impact",
    title: "Impact Reports",
    category: "Generate",
    status: "Roadmap",
    icon: BarChart3,
    purpose: "Translate discovered knowledge into measurable business and technical impact.",
    inputs: "Reuse evidence, delivery metrics, cost assumptions, risks, adoption, and outcomes.",
    outputs: "ROI forecast, confidence interval, cost estimate, maturity score, and executive narrative.",
    models: "Impact Analyst with deterministic formulas and Granite narrative synthesis.",
    businessValue: "Creates the evidence needed to fund, adopt, or retire reusable assets.",
    enterpriseUse: "Investment cases, portfolio reviews, modernization planning, and governance.",
    example: "Forecast implementation savings with explicit assumptions and sensitivity ranges.",
    architecture: "Metric ledger → formula engine → impact agent → reviewed report artifact.",
    stage: "Measure",
    dependencies: "Metric definitions, historical observations, cost model, confidence factors.",
  },
  {
    id: "timeline",
    title: "Workspace Timeline",
    category: "Operate",
    status: "V2 foundation",
    icon: TimerReset,
    purpose: "Record and replay every meaningful user, agent, tool, and workflow action.",
    inputs: "Uploads, chat turns, tool calls, approvals, mutations, artifacts, failures, and exports.",
    outputs: "Append-only event stream, correlation paths, replay plans, and compensating actions.",
    models: "No model required for integrity; AI summarizes and explains selected event ranges.",
    businessValue: "Provides auditability, demo replay, operational learning, and safe recovery.",
    enterpriseUse: "Compliance evidence, incident review, workflow optimization, and training.",
    example: "Replay the complete path from upload to approved repository without rewriting history.",
    architecture: "Event envelope → append-only ledger → projections → timeline UI → replay orchestrator.",
    stage: "Observe",
    dependencies: "Event schema, correlation IDs, idempotency, action receipts, retention policy.",
  },
  {
    id: "analytics",
    title: "Analytics",
    category: "Operate",
    status: "Roadmap",
    icon: Activity,
    purpose: "Measure quality, throughput, bottlenecks, confidence, and model operations.",
    inputs: "Workflow events, analysis metrics, task state, latency, cost, and human corrections.",
    outputs: "Operational dashboards, trends, maturity scores, and next-action recommendations.",
    models: "Deterministic aggregation with an optional insight agent for narrative interpretation.",
    businessValue: "Connects AI activity to team outcomes instead of counting prompts.",
    enterpriseUse: "Adoption monitoring, quality governance, capacity planning, and portfolio health.",
    example: "Identify that approval wait time—not model latency—is the largest delivery bottleneck.",
    architecture: "Event projections → metric observations → aggregate views → insight layer.",
    stage: "Measure",
    dependencies: "Timeline ledger, metric dictionary, pagination, scheduled aggregation.",
  },
  {
    id: "activity",
    title: "Activity Feed",
    category: "Operate",
    status: "Roadmap",
    icon: MessageSquare,
    purpose: "Give teams a concise, permission-aware view of what changed and why.",
    inputs: "Workspace events and their human-readable summaries.",
    outputs: "Filtered feed, mentions, approvals, alerts, and deep links to affected objects.",
    models: "Optional summarizer; canonical event data remains deterministic.",
    businessValue: "Reduces coordination overhead and makes autonomous work legible.",
    enterpriseUse: "Cross-functional delivery, reviewer handoff, and executive oversight.",
    example: "Architecture Agent generated v3; Security Auditor requested one approval.",
    architecture: "Timeline projection → access filter → feed API → real-time client updates.",
    stage: "Observe",
    dependencies: "Event ledger, workspace membership, notification preferences.",
  },
  {
    id: "workflow",
    title: "Workflow Engine",
    category: "Operate",
    status: "Roadmap",
    icon: Workflow,
    purpose: "Run long-lived, pauseable, retryable multi-agent plans.",
    inputs: "Objective, context snapshot, tool policy, dependencies, and approval rules.",
    outputs: "Runs, steps, retries, checkpoints, artifacts, failures, and final outcome.",
    models: "Orchestrator selects specialist agents while durable execution owns reliability.",
    businessValue: "Moves the platform from synchronous analysis to accountable autonomous work.",
    enterpriseUse: "Discovery programs, repository generation, audits, and recurring portfolio review.",
    example: "Research delegates to extraction, pattern, architecture, security, and impact agents.",
    architecture: "Real-time Agent session + durable Workflow execution + append-only event projection.",
    stage: "Orchestrate",
    dependencies: "Tool registry, run/step schema, approval engine, retries, idempotency, observability.",
  },
]

const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "experience",
    name: "Experience",
    label: "Next.js workspace",
    status: "V2 foundation",
    icon: Layers3,
    description:
      "One operating surface for the Asset Studio, artifacts, pipeline, tasks, and timeline.",
    responsibilities: [
      "Context-aware navigation and command palette",
      "Bidirectional chat and artifact synchronization",
      "Progressive disclosure for technical and executive users",
    ],
    dependencies: "Typed API client, session context, event projections, accessibility contract.",
  },
  {
    id: "control",
    name: "Control plane",
    label: "Orchestrator + policy",
    status: "V2 foundation",
    icon: BrainCircuit,
    description:
      "Translates intent into approved plans, specialist delegation, and UI actions.",
    responsibilities: [
      "Context assembly and objective planning",
      "Typed tool selection and approval policy",
      "Undo through compensating operations",
    ],
    dependencies: "Conversation memory, tool registry, workspace policy, action receipts.",
  },
  {
    id: "execution",
    name: "Execution",
    label: "Agents + durable workflows",
    status: "Roadmap",
    icon: Workflow,
    description:
      "Separates real-time interaction from failure-tolerant long-running work.",
    responsibilities: [
      "Specialist agent delegation",
      "Pause, resume, retry, and human approval",
      "Recoverable progress and intermediate artifacts",
    ],
    dependencies: "Agent session runtime, durable workflow engine, idempotent steps.",
  },
  {
    id: "intelligence",
    name: "Intelligence",
    label: "Retrieval + graph + models",
    status: "V2 foundation",
    icon: Network,
    description:
      "Creates evidence-grounded knowledge, patterns, scores, and explanations.",
    responsibilities: [
      "Extraction, embeddings, and semantic retrieval",
      "Pattern discovery and duplicate detection",
      "Knowledge graph enrichment and forecasting",
    ],
    dependencies: "Versioned sources, evidence links, provider adapters, confidence model.",
  },
  {
    id: "data",
    name: "Data and trust",
    label: "Supabase + audit ledger",
    status: "Live",
    icon: Database,
    description:
      "Keeps durable domain state, private assets, identity, provenance, and audit records.",
    responsibilities: [
      "Tenant ownership and private storage",
      "Append-only events and artifact versions",
      "Model, tool, cost, and security audit metadata",
    ],
    dependencies: "Postgres constraints, RLS, signed URLs, migrations, backup policy.",
  },
]

const CONSOLE_SCENARIOS: ConsoleScenario[] = [
  {
    command: "Generate a product requirements document",
    objective: "Turn project evidence into a decision-ready specification.",
    agents: ["Technical Writer"],
    tools: ["workspace context", "analysis evidence", "artifact writer"],
    result: "A structured PRD with requirements, risks, and acceptance criteria.",
    artifact: "Product requirements · Rich Markdown",
  },
  {
    command: "Generate a system architecture diagram",
    objective: "Visualize the implemented runtime and trust boundaries.",
    agents: ["Diagram Architect"],
    tools: ["workspace context", "analysis evidence", "artifact writer"],
    result: "A rendered, downloadable architecture diagram.",
    artifact: "System architecture · Mermaid + SVG",
  },
  {
    command: "Generate a launch campaign graphic",
    objective: "Create an original visual grounded in the project direction.",
    agents: ["Visual Designer"],
    tools: ["workspace context", "image generation", "artifact writer"],
    result: "A private, downloadable project visual with model lineage.",
    artifact: "Campaign graphic · JPEG",
  },
  {
    command: "Generate an executive impact report",
    objective: "Translate technical evidence into an adoption decision.",
    agents: ["Impact Analyst"],
    tools: ["workspace context", "analysis evidence", "artifact writer"],
    result: "A decision brief with assumptions, ranges, risks, and next actions.",
    artifact: "Executive impact brief · Rich Markdown",
  },
]

const PIPELINE_STEPS = [
  {
    name: "Idea",
    agent: "Brief Agent",
    detail: "Capture the objective, audience, constraints, and missing decisions.",
    output: "Structured brief",
  },
  {
    name: "Script",
    agent: "Script Agent",
    detail: "Evaluate hook, pacing, narrative clarity, and call to action.",
    output: "Script recommendations",
  },
  {
    name: "Assets",
    agent: "Asset Agent",
    detail: "Review composition, legibility, hierarchy, and visual consistency.",
    output: "Visual QA",
  },
  {
    name: "Edit",
    agent: "Edit Agent",
    detail: "Inspect scene timing and pacing from a structured edit timeline.",
    output: "Pacing signals",
  },
  {
    name: "Feedback",
    agent: "Feedback Agent",
    detail: "Convert reviewer notes into clear, prioritized work.",
    output: "Actionable tasks",
  },
  {
    name: "Publish",
    agent: "Human review",
    detail: "Confirm readiness while preserving the model and evidence trail.",
    output: "Approved release",
  },
  {
    name: "Analyze",
    agent: "Performance Agent",
    detail: "Connect views, retention, and CTR back to production decisions.",
    output: "Learning loop",
  },
]

const STATUS_CLASSES: Record<CapabilityStatus, string> = {
  Live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "V2 foundation":
    "border-primary/30 bg-primary/10 text-primary",
  Roadmap:
    "border-border bg-muted/60 text-muted-foreground",
}

function StatusBadge({ status }: { status: CapabilityStatus }) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full font-medium ${STATUS_CLASSES[status]}`}
    >
      {status}
    </Badge>
  )
}

function LiveStatus({ health }: { health: HealthResponse | null }) {
  const operational = health?.status === "ok"
  const model = health?.model_id?.replace("openai/", "") ?? "Checking runtime"

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3 ${styles.glassPanel}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className={`size-2 rounded-full ${
            operational ? "bg-emerald-500" : "bg-amber-500"
          } ${operational ? styles.statusPulse : ""}`}
        />
        <span className="text-xs font-semibold">
          {operational ? "Production online" : "Connecting"}
        </span>
      </div>
      <span className="hidden h-4 w-px bg-border sm:block" />
      <span className="text-xs text-muted-foreground">
        Data {health?.database === "connected" ? "connected" : "checking"}
      </span>
      <span className="hidden h-4 w-px bg-border sm:block" />
      <span className="max-w-48 truncate font-mono text-[11px] text-muted-foreground">
        {model}
      </span>
    </div>
  )
}

function ConsolePreview() {
  const [selected, setSelected] = useState(0)
  const scenario = CONSOLE_SCENARIOS[selected]

  return (
    <div
      id="console"
      className={`overflow-hidden rounded-3xl border bg-card ${styles.glassPanel}`}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-400/75" />
        <span className="size-2.5 rounded-full bg-amber-400/75" />
        <span className="size-2.5 rounded-full bg-emerald-400/75" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          AI Asset Studio · interaction model
        </span>
      </div>
      <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
        <div className="border-b p-4 lg:border-r lg:border-b-0 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Try a command
          </p>
          <div className="mt-3 space-y-2">
            {CONSOLE_SCENARIOS.map((candidate, index) => (
              <button
                type="button"
                key={candidate.command}
                onClick={() => setSelected(index)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                  selected === index
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                }`}
                aria-pressed={selected === index}
              >
                <span>{candidate.command}</span>
                <ChevronRight className="size-4 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div
          key={scenario.command}
          className={`p-5 sm:p-6 ${styles.featureReveal}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs text-primary">
                &gt; {scenario.command}
                <span className={styles.consoleCursor}>_</span>
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {scenario.objective}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Run trace</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Transparent workflow
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {scenario.agents.map((agent, index) => (
                <div key={agent} className="flex items-center gap-2">
                  <span
                    className={`rounded-lg border bg-background px-2.5 py-1.5 text-xs ${styles.agentNode}`}
                  >
                    {agent}
                  </span>
                  {index < scenario.agents.length - 1 ? (
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Selected tools
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scenario.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="font-mono text-[10px]">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reusable artifact
              </p>
              <p className="mt-3 text-xs leading-5">{scenario.artifact}</p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">Expected outcome:</span>{" "}
              {scenario.result}
            </p>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
            This is an interaction preview of the V2 control plane. Status labels
            across the page distinguish live capability from foundation and roadmap.
          </p>
        </div>
      </div>
    </div>
  )
}

function ArchitectureExplorer() {
  const [selectedId, setSelectedId] = useState(ARCHITECTURE_LAYERS[0].id)
  const selected =
    ARCHITECTURE_LAYERS.find((layer) => layer.id === selectedId) ??
    ARCHITECTURE_LAYERS[0]

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-2">
        {ARCHITECTURE_LAYERS.map((layer, index) => {
          const Icon = layer.icon
          const active = layer.id === selected.id
          return (
            <div key={layer.id}>
              <button
                type="button"
                onClick={() => setSelectedId(layer.id)}
                className={`w-full rounded-2xl border p-4 text-left ${styles.architectureNode} ${
                  active
                    ? "border-primary/45 bg-primary/10"
                    : "bg-card hover:border-foreground/20"
                }`}
                aria-pressed={active}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-xl ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground">
                      Layer {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="block truncate text-sm font-semibold">
                      {layer.name}
                    </span>
                  </span>
                  <StatusBadge status={layer.status} />
                </div>
              </button>
              {index < ARCHITECTURE_LAYERS.length - 1 ? (
                <div
                  className={`mx-auto h-5 w-px bg-border ${styles.flowLine}`}
                  aria-hidden
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div
        key={selected.id}
        className={`rounded-3xl border bg-card p-6 sm:p-8 ${styles.featureReveal}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">
              {selected.label}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              {selected.name}
            </h3>
          </div>
          <StatusBadge status={selected.status} />
        </div>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          {selected.description}
        </p>
        <div className="mt-7 space-y-3">
          {selected.responsibilities.map((responsibility) => (
            <div
              key={responsibility}
              className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-sm">{responsibility}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Load-bearing dependencies
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {selected.dependencies}
          </p>
        </div>
      </div>
    </div>
  )
}

function CapabilityExplorer() {
  const categories: Array<"All" | CapabilityCategory> = [
    "All",
    "Ingest",
    "Intelligence",
    "Generate",
    "Operate",
  ]
  const [category, setCategory] =
    useState<(typeof categories)[number]>("All")
  const visible = useMemo(
    () =>
      category === "All"
        ? CAPABILITIES
        : CAPABILITIES.filter((capability) => capability.category === category),
    [category],
  )
  const [selectedId, setSelectedId] = useState(CAPABILITIES[0].id)
  const selected =
    visible.find((capability) => capability.id === selectedId) ??
    visible[0] ??
    CAPABILITIES[0]
  const SelectedIcon = selected.icon

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Capability category">
        {categories.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setCategory(value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={category === value}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <div className="grid max-h-[680px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
          {visible.map((capability) => {
            const Icon = capability.icon
            const active = capability.id === selected.id
            return (
              <button
                type="button"
                key={capability.id}
                onClick={() => setSelectedId(capability.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-primary/45 bg-primary/10"
                    : "bg-card hover:border-foreground/20 hover:bg-muted/25"
                }`}
                aria-pressed={active}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {capability.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {capability.stage} · {capability.status}
                    </span>
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <article
          key={selected.id}
          className={`rounded-3xl border bg-card p-5 sm:p-7 ${styles.featureReveal}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <SelectedIcon className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {selected.category} · {selected.stage}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{selected.title}</h3>
              </div>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {selected.purpose}
          </p>

          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
            {[
              ["Inputs", selected.inputs],
              ["Outputs", selected.outputs],
              ["Models", selected.models],
              ["Business value", selected.businessValue],
              ["Enterprise use", selected.enterpriseUse],
              ["Example output", selected.example],
            ].map(([label, value]) => (
              <div key={label} className="bg-background p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-xs leading-5">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border bg-muted/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Technical architecture
            </p>
            <p className="mt-2 font-mono text-[11px] leading-5 text-muted-foreground">
              {selected.architecture}
            </p>
          </div>
          <div className="mt-3 rounded-2xl border bg-muted/20 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dependencies
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {selected.dependencies}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}

function PipelineWalkthrough() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setActive((current) => {
        if (current === PIPELINE_STEPS.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 1800)
    return () => window.clearInterval(timer)
  }, [playing])

  const step = PIPELINE_STEPS[active]

  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">
            Creative production pipeline
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            From idea to published work and measurable learning
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (active === PIPELINE_STEPS.length - 1) setActive(0)
            setPlaying((current) => !current)
          }}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Pause walkthrough" : "Play walkthrough"}
        </Button>
      </div>

      <div className="mt-7 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center">
          {PIPELINE_STEPS.map((candidate, index) => (
            <div key={candidate.name} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setPlaying(false)
                  setActive(index)
                }}
                className={`flex w-24 flex-col items-center gap-2 rounded-xl px-2 py-3 transition ${
                  active === index
                    ? "bg-primary/10 text-primary"
                    : index < active
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
                aria-pressed={active === index}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    index <= active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  {index < active ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="text-xs font-medium">{candidate.name}</span>
              </button>
              {index < PIPELINE_STEPS.length - 1 ? (
                <div
                  className={`h-px w-8 ${
                    index < active ? "bg-primary" : "bg-border"
                  } ${styles.flowLine}`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div
        key={step.name}
        className={`mt-5 grid gap-3 rounded-2xl border bg-muted/20 p-5 sm:grid-cols-[0.8fr_1.2fr_0.8fr] ${styles.featureReveal}`}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active specialist
          </p>
          <p className="mt-2 text-sm font-semibold">{step.agent}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Work performed
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {step.detail}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Durable output
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">{step.output}</p>
        </div>
      </div>
    </div>
  )
}

function KnowledgeMapPreview() {
  return (
    <div
      className={`relative min-h-[390px] overflow-hidden rounded-3xl border ${styles.knowledgeMapSurface}`}
      aria-label="Illustrative project knowledge map"
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 800 430"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line x1="400" y1="205" x2="150" y2="95" className={styles.knowledgeMapLine} />
        <line x1="400" y1="205" x2="660" y2="85" className={styles.knowledgeMapLine} />
        <line x1="400" y1="205" x2="165" y2="335" className={styles.knowledgeMapLine} />
        <line x1="400" y1="205" x2="645" y2="335" className={styles.knowledgeMapLine} />
        <line
          x1="150"
          y1="95"
          x2="660"
          y2="85"
          className={styles.knowledgeMapLineSecondary}
        />
        <line
          x1="165"
          y1="335"
          x2="645"
          y2="335"
          className={styles.knowledgeMapLineSecondary}
        />
      </svg>

      <div className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/35 bg-background/95 p-4 text-center backdrop-blur">
        <span className="mx-auto flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Globe2 className="size-4" />
        </span>
        <p className="mt-2 text-sm font-semibold">Reusable knowledge</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Confidence 0.87
        </p>
      </div>

      {[
        {
          position: "left-[7%] top-[12%]",
          label: "Source documents",
          sub: "12 evidence links",
          icon: FileText,
        },
        {
          position: "right-[6%] top-[10%]",
          label: "Architecture",
          sub: "4 decisions",
          icon: Layers3,
        },
        {
          position: "bottom-[10%] left-[8%]",
          label: "Repositories",
          sub: "3 related assets",
          icon: Code2,
        },
        {
          position: "right-[7%] bottom-[10%]",
          label: "Business impact",
          sub: "2 forecast models",
          icon: BarChart3,
        },
      ].map((node) => (
        <div
          key={node.label}
          className={`absolute ${node.position} w-36 rounded-2xl border bg-background/90 p-3 backdrop-blur sm:w-44`}
        >
          <node.icon className="size-4 text-primary" />
          <p className="mt-2 text-xs font-semibold">{node.label}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{node.sub}</p>
        </div>
      ))}
    </div>
  )
}

function TimelinePreview() {
  const events = [
    {
      title: "Project created",
      meta: "User · 09:42:11",
      detail: "Owned creative workspace created with an auditable project event.",
      icon: Layers3,
    },
    {
      title: "Script analysis completed",
      meta: "Script Agent · 09:42:16",
      detail: "Hook, pacing, CTA, model ID, recommendations, and tasks persisted.",
      icon: Workflow,
    },
    {
      title: "Architecture diagram generated",
      meta: "Diagram Architect · 09:43:08",
      detail: "Mermaid source, rendered preview, run steps, and content hash saved.",
      icon: Network,
    },
    {
      title: "Campaign graphic generated",
      meta: "Visual Designer · 09:43:26",
      detail: "Private image asset linked to its model, prompt version, and source run.",
      icon: Sparkles,
    },
  ]

  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-primary">
            Workspace timeline
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Every action becomes explainable evidence.
          </h3>
        </div>
        <Badge variant="outline" className="hidden rounded-full sm:inline-flex">
          Replay-safe
        </Badge>
      </div>
      <div className="relative mt-7 space-y-5 pl-9">
        <div
          className={`absolute bottom-2 left-[14px] top-2 w-px ${styles.timelineRail}`}
          aria-hidden
        />
        {events.map((event, index) => (
          <div key={event.title} className="relative">
            <span
              className={`absolute -left-9 top-1 flex size-7 items-center justify-center rounded-full border bg-background ${
                index === events.length - 1 ? styles.timelineDot : ""
              }`}
            >
              <event.icon className="size-3.5 text-primary" />
            </span>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {event.meta}
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {event.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">
            <Play />
            Open replay timeline
          </Link>
        </Button>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
        Live foundation: replay creates a new source-linked run and never mutates
        the selected historical event.
      </p>
    </div>
  )
}

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const actions = [
    { label: "Explore capabilities", href: "#capabilities", icon: Search },
    { label: "Inspect architecture", href: "#architecture", icon: Network },
    { label: "Preview the AI Asset Studio", href: "#console", icon: Command },
    { label: "Open the live dashboard", href: "/login", icon: Activity },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Command className="size-4" />
            Navigate the platform
          </DialogTitle>
          <DialogDescription>
            Jump to a technical deep dive or enter the live application.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1 p-2">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <action.icon className="size-4" />
              </span>
              <span className="flex-1 font-medium">{action.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/25 px-5 py-3 text-[10px] text-muted-foreground">
          <span>Press Esc to close</span>
          <span className="font-mono">Ctrl K</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function StoryOpsExperience() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void getHealth(controller.signal)
      .then(setHealth)
      .catch(() => setHealth(null))
    return () => controller.abort()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <main
      className={`${styles.storyOpsHome} min-h-screen overflow-hidden bg-background text-foreground`}
    >
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <header
        className={`sticky top-0 z-50 border-b border-border/70 ${styles.glassPanel}`}
      >
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">StoryOps</span>
            <span className="hidden rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
              Release 2.1
            </span>
          </Link>

          <nav
            className="mx-auto hidden items-center gap-1 text-xs text-muted-foreground lg:flex"
            aria-label="Product"
          >
            {[
              ["Platform", "#platform"],
              ["Architecture", "#architecture"],
              ["Capabilities", "#capabilities"],
              ["Knowledge map", "#knowledge-map"],
              ["Roadmap", "#roadmap"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-lg border bg-background/70 px-3 text-xs text-muted-foreground hover:text-foreground md:flex"
              aria-label="Open command palette"
            >
              <Command className="size-3.5" />
              Explore
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[9px]">
                Ctrl K
              </kbd>
            </button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                <span className="hidden sm:inline">Enter workspace</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className={`relative ${styles.heroBackdrop}`}>
        <div
          className={`pointer-events-none absolute inset-0 ${styles.gridBackdrop}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -right-24 top-10 size-80 rounded-full ${styles.ambientOrb}`}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1500px] gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-1 ${styles.glassPanel}`}
              >
                <CircleDot className="mr-1.5 size-3 text-primary" />
                AI creative operations
              </Badge>
              <span className="text-xs text-muted-foreground">
                Built with IBM Bob · Granite canonical path · live OpenAI inference
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.75rem]">
              Turn project context into{" "}
              <span className="text-primary">production-ready assets.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              StoryOps Studio unifies a seven-stage creative pipeline with an AI
              Asset Studio that generates polished documents, diagrams, code,
              analytics, and original visuals—all with project context, model
              lineage, and an explainable event timeline.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Launch the live workspace
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#platform">
                  Explore the system
                  <ChevronRight />
                </a>
              </Button>
            </div>

            <div className="mt-8">
              <LiveStatus health={health} />
            </div>
          </div>

          <div className="relative min-w-0">
            <div
              className={`absolute -inset-6 rounded-[2.5rem] bg-primary/5 blur-2xl`}
              aria-hidden
            />
            <div
              className={`relative overflow-hidden rounded-3xl border p-2 ${styles.glassPanel}`}
            >
              <div className="rounded-[1.25rem] border bg-background/92">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      AI Asset Studio
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[9px]">
                    RUN-2048
                  </Badge>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="rounded-2xl border bg-muted/25 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Bot className="size-4" />
                      </span>
                      <div>
                        <p className="font-mono text-xs">
                          Generate a launch campaign graphic.
                        </p>
                        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                          Project context assembled, visual brief refined, image
                          generated, and private asset persisted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {([
                      ["8", "Asset categories", FileText],
                      ["5", "Output formats", PackageCheck],
                      ["0.86", "Confidence", Activity],
                    ] satisfies Array<[string, string, LucideIcon]>).map(
                      ([value, label, Icon]) => (
                      <div key={String(label)} className="rounded-2xl border p-3">
                        <Icon className="size-3.5 text-primary" />
                        <p className="mt-3 text-xl font-semibold">{value}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {label}
                        </p>
                      </div>
                      ),
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Asset workflow</p>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Completed
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      {([
                        ["Context", BrainCircuit],
                        ["Image model", Sparkles],
                        ["Private asset", PackageCheck],
                      ] satisfies Array<[string, LucideIcon]>).map(
                        ([label, Icon], index) => (
                        <div key={String(label)} className="contents">
                          <div
                            className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border bg-muted/20 px-2 py-3 text-center ${styles.agentNode}`}
                          >
                            <Icon className="size-4 text-primary" />
                            <span className="mt-2 truncate text-[10px] font-medium">
                              {label}
                            </span>
                          </div>
                          {index < 2 ? (
                            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                          ) : null}
                        </div>
                        ),
                      )}
                    </div>
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full w-full rounded-full bg-primary ${styles.metricBar}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 divide-x divide-y px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            ["7", "Live creative stages"],
            ["6", "Specialized analyzers"],
            ["2", "Model provider paths"],
            ["100%", "Audited analysis IDs"],
          ].map(([value, label]) => (
            <div key={label} className="px-4 py-7 sm:px-6">
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              The problem
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Creative teams lose context every time work changes tools.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              Briefs, scripts, visuals, edit decisions, reviewer notes, tasks, and
              performance signals become disconnected. StoryOps keeps the evidence,
              AI output, action, and production history in one owned project.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Boxes,
                title: "Fragmented evidence",
                text: "Documents, code, assets, and decisions have no shared lineage.",
              },
              {
                icon: Search,
                title: "Disposable AI output",
                text: "Useful generations disappear in chat instead of becoming project assets.",
              },
              {
                icon: ShieldCheck,
                title: "Weak traceability",
                text: "Recommendations lack project evidence, model identity, and a durable run trace.",
              },
              {
                icon: TimerReset,
                title: "No learning loop",
                text: "Delivery outcomes rarely improve the next discovery or architecture decision.",
              },
            ].map((pain, index) => (
              <article
                key={pain.title}
                className={`rounded-3xl border bg-card p-6 ${
                  index === 0 || index === 3 ? "sm:translate-y-5" : ""
                }`}
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <pain.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{pain.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {pain.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Primary interaction model
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Conversation becomes a reusable project asset.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              Choose a proven template or describe what you need. StoryOps selects
              one specialist path, records its tools and model, renders the result,
              and persists it with replayable project evidence.
            </p>
          </div>
          <ConsolePreview />
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Architecture explorer
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            A control plane for intelligence, execution, and trust.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            Click each layer to inspect its responsibility, maturity, and
            load-bearing dependencies.
          </p>
        </div>
        <ArchitectureExplorer />
      </section>

      <section className="border-y bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <PipelineWalkthrough />
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            AI capability explorer
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Understand every capability before you enter the application.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
            Purpose, inputs, outputs, models, business value, use cases,
            architecture, pipeline stage, dependencies, and implementation
            maturity are visible in one self-guided product demo.
          </p>
        </div>
        <CapabilityExplorer />
      </section>

      <section id="knowledge-map" className="border-y bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Project knowledge map
              </p>
              <StatusBadge status="Roadmap" />
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              See the lineage behind every recommendation.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              The roadmap knowledge map will connect project evidence, generated
              assets, decisions, workflow runs, and outcomes. Today, that lineage
              is available through the implemented timeline and run trace.
            </p>
            <div className="mt-7 space-y-3">
              {[
                "Trace any output to contributing source versions",
                "Reveal duplicates, gaps, bottlenecks, and predicted relationships",
                "Apply workspace permissions before graph projection",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <KnowledgeMapPreview />
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <TimelinePreview />
          <div className="lg:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Explainable by design
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Ask why. Get evidence, not theater.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              StoryOps Studio exposes the objective, selected specialist, persisted
              tool steps, confidence, model identity, generated assets, replay
              lineage, and failures. It does not expose private chain-of-thought
              or invent certainty.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["Evidence", "Owned item, analysis, task, run, event, and artifact references."],
                ["Confidence", "Coverage-aware confidence with explicit missing evidence."],
                ["Audit", "Provider, model ID, prompt version, tools, latency, usage, and fallback."],
                ["Control", "Private storage, replay lineage, and no model-side mutating tools."],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl border bg-card p-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Specialist routing model
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                The right specialist for each creative job.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Each run selects one bounded specialist path and the local data
                views it needs. The run trace records what actually executed
                without pretending a single model call is an autonomous team.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {([
                ["Brief Agent", "Objectives, constraints, and gaps", FileSearch],
                ["Script Agent", "Hooks, pacing, narrative, and CTA", FileText],
                ["Asset Agent", "Visual hierarchy and consistency", Boxes],
                ["Edit Agent", "Scene timing and pacing signals", Activity],
                ["Feedback Agent", "Reviewer notes into clear tasks", MessageSquare],
                ["Performance Agent", "Retention, views, and CTR", BarChart3],
                ["Diagram Architect", "Mermaid architecture and flows", Layers3],
                ["Technical Writer", "Reports and documentation", FileText],
                ["Visual Designer", "Original generated project visuals", Sparkles],
              ] satisfies Array<[string, string, LucideIcon]>).map(
                ([name, role, Icon]) => (
                <article key={String(name)} className="rounded-2xl border bg-card p-4">
                  <Icon className="size-4 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {role}
                  </p>
                </article>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border bg-card p-7 lg:col-span-2">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Business impact model
              </p>
              <StatusBadge status="Roadmap" />
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              A future evidence model for measuring reuse.
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                ["Avoided effort", "hours not repeated × blended delivery cost"],
                ["Adoption value", "active consumers × validated outcome delta"],
                ["Risk-adjusted ROI", "(benefit range − cost range) × confidence"],
              ].map(([label, formula]) => (
                <div key={label}>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-2 font-mono text-[11px] leading-5 text-muted-foreground">
                    {formula}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
              Forecasts remain decision support: every report shows assumptions,
              ranges, missing evidence, and sensitivity—not fabricated precision.
            </div>
          </article>

          <article className="rounded-3xl border bg-primary p-7 text-primary-foreground">
            <LockKeyhole className="size-5" />
            <h3 className="mt-5 text-xl font-semibold">Enterprise trust boundary</h3>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/75">
              <li>Tenant ownership on every resource</li>
              <li>Private assets with signed reads</li>
              <li>Bounded model inputs and outputs</li>
              <li>Provider and fallback audit IDs</li>
              <li>No model-side mutating tools</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-20 lg:py-28">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Enterprise integrations
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Designed to sit above the tools teams already use.
              </h2>
            </div>
            <StatusBadge status="Roadmap" />
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Source control", "GitHub · GitLab · Bitbucket", GitBranch],
              ["Knowledge", "SharePoint · Notion · Confluence", FileText],
              ["Delivery", "Jira · Linear · ServiceNow", Workflow],
              ["Communication", "Slack · Teams · Email", MessageSquare],
              ["Cloud", "IBM Cloud · Cloudflare · AWS", Cloud],
              ["Identity", "Supabase Auth · OIDC · SAML", LockKeyhole],
              ["Data", "Postgres · object storage · vectors", Database],
              ["Model layer", "watsonx.ai · provider adapters", BrainCircuit],
            ] satisfies Array<[string, string, LucideIcon]>).map(
              ([title, detail, Icon]) => (
              <div key={String(title)} className="bg-card p-5">
                <Icon className="size-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-[1500px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Delivery roadmap
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Ambitious, dependency-ordered, and honest.
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              label: "Now · Live foundation",
              status: "Live" as const,
              items: [
                "Authenticated multi-tenant workspaces",
                "Creative pipeline and private uploads",
                "Structured text and vision analysis",
                "AI Asset Studio for documents, diagrams, code, and visuals",
              ],
            },
            {
              label: "Current · Control plane",
              status: "V2 foundation" as const,
              items: [
                "Durable conversations and generated asset records",
                "Reloadable run steps and provider audit metadata",
                "Evidence-grounded replay lineage",
                "Application append-only workspace timeline",
              ],
            },
            {
              label: "Later · Creative intelligence",
              status: "Roadmap" as const,
              items: [
                "Document parsing and embeddings",
                "Pattern discovery and authorized semantic search",
                "Project knowledge map",
                "Durable workflow execution and collaboration",
              ],
            },
          ].map((phase) => (
            <article key={phase.label} className="rounded-3xl border bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{phase.label}</h3>
                <StatusBadge status={phase.status} />
              </div>
              <ul className="mt-6 space-y-3">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
                Start with the deployed platform
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Bring the next creative asset into the same accountable workflow.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-primary-foreground/70">
                The current release connects specialist analysis, task handoff,
                rich asset generation, private storage, run traces, and replay
                lineage in one deployed StoryOps Studio workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild size="lg" variant="secondary">
                <Link href="/register">
                  Create workspace
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/login">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </span>
            <span>StoryOps Studio · Creative operations and AI Asset Studio</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="#architecture" className="hover:text-foreground">
              Architecture
            </a>
            <a href="#capabilities" className="hover:text-foreground">
              Capabilities
            </a>
            <Link href="/settings" className="hover:text-foreground">
              System status
            </Link>
          </div>
          <span className="font-mono">IBM AI Builders Challenge 2026</span>
        </div>
      </footer>
    </main>
  )
}
