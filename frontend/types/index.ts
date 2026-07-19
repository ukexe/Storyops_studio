export const PIPELINE_STAGES = [
  "Idea",
  "Script",
  "Assets",
  "Edit",
  "Feedback",
  "Publish",
  "Analyze",
] as const

export const ITEM_TYPES = [
  "brief",
  "script",
  "asset",
  "edit",
  "feedback",
  "metric",
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]
export type ItemType = (typeof ITEM_TYPES)[number]
export type Priority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in_progress" | "done"
export type WatsonxStatus = "unknown" | "connected" | "error"

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string | null
  repo_url: string | null
  created_at: string
  updated_at: string
  item_counts: Record<PipelineStage, number>
}

export interface Recommendation {
  title: string
  detail: string
  priority: Priority
}

export interface Analysis {
  id: string
  item_id: string
  agent_type: string
  summary: string
  recommendations: Recommendation[]
  score_metrics: Record<string, unknown>
  model_id: string
  created_at: string
}

export interface Item {
  id: string
  project_id: string
  stage: PipelineStage
  type: ItemType
  title: string
  content: string | null
  file_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  latest_analysis: Analysis | null
}

export type ItemsByStage = Record<PipelineStage, Item[]>

export interface Task {
  id: string
  project_id: string
  linked_item_id: string | null
  linked_item_title: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  created_at: string
  updated_at: string
}

export interface HealthResponse {
  status: "ok" | "error"
  database: "unknown" | "connected" | "error"
  watsonx: WatsonxStatus
  openai?: "configured" | "unavailable"
  analysis_mode?: "watsonx" | "openai" | "edge-rules"
  fallback_mode?: "edge-rules"
  model_id?: string | null
}

export interface DemoSeedResponse {
  project_id: string
}

export interface ProjectCreateInput {
  name: string
  description?: string | null
  repo_url?: string | null
}

export interface ProjectUpdateInput {
  name?: string
  description?: string | null
  repo_url?: string | null
}

export interface ItemCreateInput {
  stage: PipelineStage
  type: ItemType
  title: string
  content?: string | null
  metadata?: Record<string, unknown>
  file?: File | null
}

export interface ItemUpdateInput {
  stage?: PipelineStage
  title?: string
  content?: string | null
  metadata?: Record<string, unknown>
}

export interface TaskUpdateInput {
  status?: TaskStatus
  priority?: Priority
}
