import { getPublicEnv } from "@/lib/env"
import { createClient as createSupabaseClient } from "@/utils/supabase/client"
import type {
  Analysis,
  Artifact,
  ConsoleTurnInput,
  ConsoleTurnResponse,
  Conversation,
  ConversationMessage,
  DemoSeedResponse,
  HealthResponse,
  Item,
  ItemCreateInput,
  ItemsByStage,
  ItemUpdateInput,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  Task,
  TaskStatus,
  TaskUpdateInput,
  WorkflowRun,
  WorkflowStep,
  WorkspaceEventPage,
} from "@/types"

const API_BASE_URL = getPublicEnv().apiUrl

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean
}

function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`
}

function errorMessage(detail: unknown, fallback: string) {
  if (typeof detail === "string") {
    return detail
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String(entry.msg)
        }
        return null
      })
      .filter(Boolean)
    if (messages.length > 0) {
      return messages.join("; ")
    }
  }
  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers: initialHeaders,
    ...fetchOptions
  } = options
  const headers = new Headers(initialHeaders)
  headers.set("Accept", "application/json")

  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }

  if (authenticated) {
    const {
      data: { session },
    } = await createSupabaseClient().auth.getSession()
    if (!session?.access_token) {
      throw new ApiError(401, "Your session has expired. Please sign in again.")
    }
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }

  const response = await fetch(apiUrl(path), {
    ...fetchOptions,
    headers,
    cache: "no-store",
  })

  const responseText = await response.text()
  let payload: unknown
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      try {
        await createSupabaseClient().auth.signOut({ scope: "local" })
      } catch {
        // Preserve the API error even if local session cleanup fails.
      }
    }
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? payload.detail
        : payload
    throw new ApiError(
      response.status,
      errorMessage(detail, response.statusText || "Request failed"),
      detail,
    )
  }

  return payload as T
}

export function getProjects(signal?: AbortSignal) {
  return apiRequest<Project[]>("/projects/", { signal })
}

export function createProject(input: ProjectCreateInput) {
  return apiRequest<Project>("/projects/", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function getProject(projectId: string, signal?: AbortSignal) {
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, {
    signal,
  })
}

export function updateProject(
  projectId: string,
  input: ProjectUpdateInput,
) {
  return apiRequest<Project>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteProject(projectId: string) {
  return apiRequest<void>(`/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  })
}

export function getProjectItems(projectId: string, signal?: AbortSignal) {
  return apiRequest<ItemsByStage>(
    `/projects/${encodeURIComponent(projectId)}/items`,
    { signal },
  )
}

export function createItem(projectId: string, input: ItemCreateInput) {
  const form = new FormData()
  form.set("stage", input.stage)
  form.set("type", input.type)
  form.set("title", input.title)
  if (input.content != null) {
    form.set("content", input.content)
  }
  form.set("metadata", JSON.stringify(input.metadata ?? {}))
  if (input.file) {
    form.set("file", input.file)
  }

  return apiRequest<Item>(
    `/projects/${encodeURIComponent(projectId)}/items`,
    {
      method: "POST",
      body: form,
    },
  )
}

export function getItem(itemId: string, signal?: AbortSignal) {
  return apiRequest<Item>(`/items/${encodeURIComponent(itemId)}`, { signal })
}

export function updateItem(itemId: string, input: ItemUpdateInput) {
  return apiRequest<Item>(`/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteItem(itemId: string) {
  return apiRequest<void>(`/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  })
}

export function analyzeItem(itemId: string) {
  return apiRequest<Analysis>(`/items/${encodeURIComponent(itemId)}/analyze`, {
    method: "POST",
  })
}

export function getItemAnalyses(itemId: string, signal?: AbortSignal) {
  return apiRequest<Analysis[]>(
    `/items/${encodeURIComponent(itemId)}/analyses`,
    { signal },
  )
}

export function getProjectTasks(
  projectId: string,
  status?: TaskStatus,
  signal?: AbortSignal,
) {
  const search = status ? `?status=${encodeURIComponent(status)}` : ""
  return apiRequest<Task[]>(
    `/projects/${encodeURIComponent(projectId)}/tasks${search}`,
    { signal },
  )
}

export function updateTask(taskId: string, input: TaskUpdateInput) {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function updateTaskStatus(taskId: string, status: TaskStatus) {
  return updateTask(taskId, { status })
}

export function deleteTask(taskId: string) {
  return apiRequest<void>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  })
}

export function getHealth(signal?: AbortSignal) {
  const healthUrl = /^https?:\/\//.test(API_BASE_URL)
    ? `${new URL(API_BASE_URL).origin}/health`
    : new URL(
        "/health",
        typeof window === "undefined"
          ? "http://localhost:3000"
          : window.location.origin,
      ).toString()
  return apiRequest<HealthResponse>(healthUrl, {
    authenticated: false,
    signal,
  })
}

export function seedDemo() {
  return apiRequest<DemoSeedResponse>("/demo/seed", { method: "POST" })
}

export function createConsoleTurn(
  projectId: string,
  input: ConsoleTurnInput,
) {
  return apiRequest<ConsoleTurnResponse>(
    `/projects/${encodeURIComponent(projectId)}/console/turns`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  )
}

export function getProjectConversations(
  projectId: string,
  signal?: AbortSignal,
) {
  return apiRequest<Conversation[]>(
    `/projects/${encodeURIComponent(projectId)}/conversations`,
    { signal },
  )
}

export function getConversationMessages(
  conversationId: string,
  signal?: AbortSignal,
) {
  return apiRequest<ConversationMessage[]>(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { signal },
  )
}

export function getProjectArtifacts(
  projectId: string,
  signal?: AbortSignal,
) {
  return apiRequest<Artifact[]>(
    `/projects/${encodeURIComponent(projectId)}/artifacts`,
    { signal },
  )
}

export function getProjectWorkflowRuns(
  projectId: string,
  signal?: AbortSignal,
) {
  return apiRequest<WorkflowRun[]>(
    `/projects/${encodeURIComponent(projectId)}/runs`,
    { signal },
  )
}

export function getWorkflowRunSteps(runId: string, signal?: AbortSignal) {
  return apiRequest<WorkflowStep[]>(
    `/runs/${encodeURIComponent(runId)}/steps`,
    { signal },
  )
}

export function getWorkspaceEvents(
  projectId: string,
  cursor?: string | null,
  signal?: AbortSignal,
) {
  const search = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
  return apiRequest<WorkspaceEventPage>(
    `/projects/${encodeURIComponent(projectId)}/events${search}`,
    { signal },
  )
}
