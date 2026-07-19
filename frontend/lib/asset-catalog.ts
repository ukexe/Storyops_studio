export const ASSET_CATEGORIES = [
  "Documentation",
  "Visual",
  "Architecture",
  "Engineering",
  "Product",
  "Business",
  "Marketing",
  "Analytics",
] as const

export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

export interface AssetTemplate {
  id: string
  category: AssetCategory
  title: string
  description: string
  format: "Document" | "Image" | "Diagram" | "Code" | "Dashboard"
  prompt: string
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    id: "prd",
    category: "Documentation",
    title: "Product requirements",
    description: "Objectives, scope, requirements, risks, and success criteria.",
    format: "Document",
    prompt:
      "Generate a product requirements document for this project, grounded in current items, analyses, tasks, and known evidence gaps.",
  },
  {
    id: "technical-spec",
    category: "Documentation",
    title: "Technical specification",
    description: "Architecture, interfaces, constraints, rollout, and testing.",
    format: "Document",
    prompt:
      "Generate a technical specification for this project with architecture, interfaces, constraints, failure handling, rollout, and acceptance tests.",
  },
  {
    id: "stories",
    category: "Documentation",
    title: "User stories",
    description: "Prioritized stories with testable acceptance criteria.",
    format: "Document",
    prompt:
      "Generate prioritized user stories and acceptance criteria from the current project evidence.",
  },
  {
    id: "release-notes",
    category: "Documentation",
    title: "Release notes",
    description: "Customer-ready summary, changes, limitations, and rollout notes.",
    format: "Document",
    prompt:
      "Generate polished release notes and a changelog entry from this project's completed work and open risks.",
  },
  {
    id: "sop",
    category: "Documentation",
    title: "Operating procedure",
    description: "Repeatable steps, owners, checks, exceptions, and evidence.",
    format: "Document",
    prompt:
      "Generate a standard operating procedure for this project's creative workflow, including owners, checks, exceptions, and evidence.",
  },
  {
    id: "feature-illustration",
    category: "Visual",
    title: "Feature illustration",
    description: "Original hero or feature visual grounded in project context.",
    format: "Image",
    prompt:
      "Generate an original feature illustration for this project with a premium editorial style, clear focal point, and accessible contrast.",
  },
  {
    id: "storyboard",
    category: "Visual",
    title: "Storyboard",
    description: "A coherent visual sequence for the current narrative.",
    format: "Image",
    prompt:
      "Generate a storyboard contact sheet for the current project narrative with clearly differentiated scenes and consistent visual direction.",
  },
  {
    id: "character",
    category: "Visual",
    title: "Character concept",
    description: "Original character direction with production-ready detail.",
    format: "Image",
    prompt:
      "Generate an original character concept for this project in a polished full-body portrait with production-ready costume and color details.",
  },
  {
    id: "brand-mark",
    category: "Visual",
    title: "Logo concept",
    description: "Original brand-mark exploration without third-party marks.",
    format: "Image",
    prompt:
      "Generate an original logo concept for this project, using a simple memorable symbol and no third-party logos or copyrighted characters.",
  },
  {
    id: "campaign-graphic",
    category: "Visual",
    title: "Campaign graphic",
    description: "Launch banner, cover, social, or presentation visual.",
    format: "Image",
    prompt:
      "Generate a marketing banner for this project's launch campaign with a strong hierarchy, safe text area, and premium visual finish.",
  },
  {
    id: "system-architecture",
    category: "Architecture",
    title: "System architecture",
    description: "Professional component and integration overview.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid system architecture diagram grounded in this project's implemented components and integrations.",
  },
  {
    id: "data-flow",
    category: "Architecture",
    title: "Data flow",
    description: "Inputs, transformations, stores, and trust boundaries.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid data flow diagram for this project, including inputs, transformations, storage, AI providers, and trust boundaries.",
  },
  {
    id: "sequence",
    category: "Architecture",
    title: "Sequence diagram",
    description: "A request or workflow traced across participants.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid sequence diagram for the project's primary end-to-end workflow, including failures and persistence.",
  },
  {
    id: "deployment",
    category: "Architecture",
    title: "Deployment diagram",
    description: "Runtime topology, providers, data, and observability.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid deployment diagram for the current project using only implemented runtime and infrastructure evidence.",
  },
  {
    id: "erd",
    category: "Engineering",
    title: "Database schema",
    description: "Entity relationships, ownership, and lifecycle.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid ER diagram for the project's current data model, ownership boundaries, and important lifecycle relationships.",
  },
  {
    id: "sql",
    category: "Engineering",
    title: "SQL implementation",
    description: "Reviewable SQL grounded in the current schema.",
    format: "Code",
    prompt:
      "Generate a SQL migration script for the requested project change, including constraints, indexes, safe rollback notes, and verification queries.",
  },
  {
    id: "openapi",
    category: "Engineering",
    title: "OpenAPI specification",
    description: "Machine-readable API contract with schemas and errors.",
    format: "Code",
    prompt:
      "Generate an OpenAPI specification for the project's implemented API surface with authentication, schemas, errors, and examples.",
  },
  {
    id: "json-schema",
    category: "Engineering",
    title: "JSON schema",
    description: "Strict, reusable validation for project data.",
    format: "Code",
    prompt:
      "Generate a JSON schema for the project's primary artifact or workflow contract with strict validation and documented fields.",
  },
  {
    id: "types",
    category: "Engineering",
    title: "Type definitions",
    description: "Production TypeScript contracts from current evidence.",
    format: "Code",
    prompt:
      "Generate TypeScript type definitions for the project's primary API and artifact contracts.",
  },
  {
    id: "roadmap",
    category: "Product",
    title: "Product roadmap",
    description: "Outcome-led now/next/later plan with dependencies.",
    format: "Document",
    prompt:
      "Generate an outcome-led product roadmap for this project with now, next, later, dependencies, risks, and measurable exit criteria.",
  },
  {
    id: "sprint",
    category: "Product",
    title: "Sprint plan",
    description: "Prioritized sprint scope, owners, dependencies, and tests.",
    format: "Document",
    prompt:
      "Generate a sprint plan from this project's open tasks, evidence gaps, dependencies, and release risks.",
  },
  {
    id: "risk",
    category: "Product",
    title: "Risk analysis",
    description: "Likelihood, impact, mitigation, owner, and signals.",
    format: "Document",
    prompt:
      "Generate a project risk analysis with likelihood, impact, mitigation, owner, leading indicators, and contingency actions.",
  },
  {
    id: "journey",
    category: "Product",
    title: "User journey",
    description: "Persona, stages, needs, friction, and opportunities.",
    format: "Document",
    prompt:
      "Generate a user journey and primary persona for this project, grounded in the current workflow and evidence.",
  },
  {
    id: "pitch",
    category: "Business",
    title: "Pitch deck",
    description: "Narrative, problem, solution, evidence, market, and ask.",
    format: "Document",
    prompt:
      "Generate a concise pitch deck narrative for this project with problem, solution, differentiation, evidence, market, roadmap, and ask.",
  },
  {
    id: "executive",
    category: "Business",
    title: "Executive summary",
    description: "Decision-ready findings, risks, value, and next actions.",
    format: "Document",
    prompt:
      "Generate an executive summary for this project with evidence, business value, risks, assumptions, and next actions.",
  },
  {
    id: "roi",
    category: "Business",
    title: "ROI report",
    description: "Explicit assumptions, ranges, sensitivity, and decision criteria.",
    format: "Document",
    prompt:
      "Generate an ROI report and value proposition for this project using explicit assumptions, ranges, sensitivity, and missing evidence.",
  },
  {
    id: "market",
    category: "Business",
    title: "Market analysis",
    description: "Audience, alternatives, differentiation, and opportunity.",
    format: "Document",
    prompt:
      "Generate a market and competitive analysis for this project without inventing external facts; separate workspace evidence from assumptions.",
  },
  {
    id: "landing-copy",
    category: "Marketing",
    title: "Landing page copy",
    description: "Positioning, hero, proof, features, objections, and CTA.",
    format: "Document",
    prompt:
      "Generate landing page copy for this project with positioning, hero, proof, features, objections, and a focused call to action.",
  },
  {
    id: "launch-campaign",
    category: "Marketing",
    title: "Launch campaign",
    description: "Email, social, announcement, and channel adaptation.",
    format: "Document",
    prompt:
      "Generate a product launch copy package with announcement, email campaign, social posts, and channel-specific calls to action.",
  },
  {
    id: "blog",
    category: "Marketing",
    title: "Blog article",
    description: "Search-friendly long-form narrative grounded in evidence.",
    format: "Document",
    prompt:
      "Generate a search-friendly blog article about this project, grounded in workspace evidence and clearly marking assumptions.",
  },
  {
    id: "kpi",
    category: "Analytics",
    title: "KPI dashboard",
    description: "Visual KPI summary with definitions and evidence gaps.",
    format: "Dashboard",
    prompt:
      "Generate a Mermaid KPI dashboard for this project using current item, analysis, task, and workflow metrics.",
  },
  {
    id: "gantt",
    category: "Analytics",
    title: "Gantt chart",
    description: "Dependency-aware project schedule and milestones.",
    format: "Diagram",
    prompt:
      "Generate a Mermaid Gantt chart for this project's next delivery phase using current dependencies and release risks.",
  },
  {
    id: "burndown",
    category: "Analytics",
    title: "Burndown chart",
    description: "Sprint progress visual with explicit assumptions.",
    format: "Dashboard",
    prompt:
      "Generate a Mermaid burndown chart for the current sprint using available task evidence and clearly stated assumptions.",
  },
  {
    id: "progress",
    category: "Analytics",
    title: "Progress report",
    description: "Status, milestones, blockers, trends, and next decisions.",
    format: "Document",
    prompt:
      "Generate a project progress report with milestones, blockers, task status, analysis coverage, trends, and next decisions.",
  },
]
