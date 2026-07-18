"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { Header } from "@/components/shared/Header"
import { TaskCard } from "@/components/tasks/TaskCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ApiError,
  getProject,
  getProjectTasks,
  updateTaskStatus,
} from "@/lib/api"
import type { Project, Task, TaskStatus } from "@/types"

const COLUMNS: Array<{
  status: TaskStatus
  title: string
  description: string
}> = [
  {
    status: "todo",
    title: "To do",
    description: "Ready for the team to pick up.",
  },
  {
    status: "in_progress",
    title: "In progress",
    description: "Actively being addressed.",
  },
  {
    status: "done",
    title: "Done",
    description: "Completed recommendations.",
  },
]

export default function ProjectTasksPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [announcement, setAnnouncement] = useState("")

  const loadTasks = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [projectResponse, taskResponse] = await Promise.all([
          getProject(projectId, signal),
          getProjectTasks(projectId, undefined, signal),
        ])
        setProject(projectResponse)
        setTasks(taskResponse)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return
        }
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace(
            `/login?next=${encodeURIComponent(window.location.pathname)}`,
          )
          return
        }
        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load tasks.",
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [projectId, router],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadTasks(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadTasks])

  const tasksByStatus = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }),
    [tasks],
  )

  function retryLoad() {
    setLoadError(null)
    setIsLoading(true)
    void loadTasks()
  }

  async function handleStatusChange(task: Task, nextStatus: TaskStatus) {
    if (task.status === nextStatus || updatingTaskIds.has(task.id)) {
      return
    }

    const previousStatus = task.status
    setMutationError(null)
    setAnnouncement("")
    setUpdatingTaskIds((current) => new Set(current).add(task.id))
    setTasks((current) =>
      current.map((candidate) =>
        candidate.id === task.id
          ? { ...candidate, status: nextStatus }
          : candidate,
      ),
    )

    try {
      const updatedTask = await updateTaskStatus(task.id, nextStatus)
      setTasks((current) =>
        current.map((candidate) =>
          candidate.id === task.id ? updatedTask : candidate,
        ),
      )
      setAnnouncement(`${task.title} moved to ${nextStatus.replace("_", " ")}.`)
    } catch (caught) {
      setTasks((current) =>
        current.map((candidate) =>
          candidate.id === task.id
            ? { ...candidate, status: previousStatus }
            : candidate,
        ),
      )
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        )
        return
      }
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to update task status."
      setMutationError(message)
      setAnnouncement(`${task.title} could not be moved. The change was undone.`)
    } finally {
      setUpdatingTaskIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-muted/15">
      <Header
        context={
          <span className="block max-w-48 truncate">
            {project?.name ?? "Project tasks"}
          </span>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        {isLoading ? (
          <>
            <Skeleton className="h-5 w-72 max-w-full" />
            <Skeleton className="mt-7 h-10 w-56" />
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((column) => (
                <Skeleton key={column.status} className="h-[440px]" />
              ))}
            </div>
          </>
        ) : null}

        {!isLoading && loadError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Tasks unavailable</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                <RefreshCw />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !loadError && project ? (
          <>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground"
            >
              <Link
                href="/dashboard"
                className="shrink-0 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Dashboard
              </Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <Link
                href={`/projects/${project.id}`}
                className="max-w-48 truncate rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {project.name}
              </Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <span className="font-medium text-foreground" aria-current="page">
                Tasks
              </span>
            </nav>

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  AI recommendations
                </Badge>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Task board
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Move generated recommendations through your team workflow.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                <RefreshCw />
                Refresh
              </Button>
            </div>

            {mutationError ? (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle />
                <AlertTitle>Task update failed</AlertTitle>
                <AlertDescription>{mutationError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid items-start gap-4 lg:grid-cols-3">
              {COLUMNS.map((column) => {
                const columnTasks = tasksByStatus[column.status]
                return (
                  <section
                    key={column.status}
                    className="rounded-xl border bg-muted/25"
                    aria-labelledby={`tasks-${column.status}`}
                  >
                    <header className="border-b px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2
                          id={`tasks-${column.status}`}
                          className="font-semibold"
                        >
                          {column.title}
                        </h2>
                        <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                          {columnTasks.length}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {column.description}
                      </p>
                    </header>
                    <div className="space-y-3 p-3">
                      {columnTasks.length > 0 ? (
                        columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            isUpdating={updatingTaskIds.has(task.id)}
                            onStatusChange={(status) =>
                              void handleStatusChange(task, status)
                            }
                          />
                        ))
                      ) : (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed bg-background/50 p-6 text-center">
                          <ClipboardList className="size-5 text-muted-foreground" />
                          <p className="mt-2 text-xs text-muted-foreground">
                            No tasks here
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
