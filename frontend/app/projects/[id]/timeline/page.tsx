"use client"

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  GitBranch,
  History,
  Layers3,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { WorkspaceTimeline } from "@/components/control-plane/WorkspaceTimeline"
import { Header } from "@/components/shared/Header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  ApiError,
  getProject,
  getProjectArtifacts,
  getProjectWorkflowRuns,
  getWorkspaceEvents,
} from "@/lib/api"
import type {
  Artifact,
  Project,
  WorkflowRun,
  WorkspaceEvent,
} from "@/types"

export default function ProjectTimelinePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [events, setEvents] = useState<WorkspaceEvent[]>([])
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadTimeline = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [projectResponse, eventResponse, runResponse, artifactResponse] =
          await Promise.all([
            getProject(projectId, signal),
            getWorkspaceEvents(projectId, null, signal),
            getProjectWorkflowRuns(projectId, signal),
            getProjectArtifacts(projectId, signal),
          ])
        setProject(projectResponse)
        setEvents(eventResponse.events)
        setNextCursor(eventResponse.next_cursor)
        setRuns(runResponse)
        setArtifacts(artifactResponse)
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
          caught instanceof Error
            ? caught.message
            : "Unable to load the workspace timeline.",
        )
      } finally {
        if (!signal?.aborted) setIsLoading(false)
      }
    },
    [projectId, router],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadTimeline(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadTimeline])

  const metrics = useMemo(
    () => ({
      eventCount: events.length,
      completedRuns: runs.filter((run) => run.status === "completed").length,
      artifacts: artifacts.length,
      reversible: events.filter((event) => event.is_reversible).length,
    }),
    [artifacts.length, events, runs],
  )

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const response = await getWorkspaceEvents(projectId, nextCursor)
      setEvents((current) => [
        ...current,
        ...response.events.filter(
          (event) => !current.some((candidate) => candidate.id === event.id),
        ),
      ])
      setNextCursor(response.next_cursor)
    } catch (caught) {
      toast.error("Unable to load older events", {
        description:
          caught instanceof Error ? caught.message : "Timeline request failed.",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  function createReplayPlan(event: WorkspaceEvent) {
    if (!event.run_id) return
    sessionStorage.setItem(
      `storyops-console-replay:${projectId}`,
      JSON.stringify({ runId: event.run_id, eventId: event.id }),
    )
    sessionStorage.setItem(
      `storyops-console-draft:${projectId}`,
      "Compare the selected historical run with current project evidence. Explain the original objective, persisted steps, changed evidence, and the proposed replay plan before any new action.",
    )
    router.push(`/projects/${projectId}/console`)
  }

  function retryLoad() {
    setLoadError(null)
    setIsLoading(true)
    void loadTimeline()
  }

  return (
    <div className="min-h-screen bg-muted/15">
      <Header
        context={
          <span className="block max-w-48 truncate">
            {project?.name ?? "Workspace timeline"}
          </span>
        }
      />

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6">
        {isLoading ? (
          <div>
            <Skeleton className="h-9 w-80 max-w-full" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28" />
              ))}
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
              <Skeleton className="h-[680px]" />
              <Skeleton className="h-[520px]" />
            </div>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Timeline unavailable</AlertTitle>
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
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <History className="size-3" />
                    Enterprise event ledger
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Append-only · correlation-aware · replay-safe
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Workspace timeline
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Follow uploads, analyses, task changes, chat requests, delegated
                  runs, generated artifacts, failures, and model audits as one
                  explainable event stream.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${projectId}`}>
                    <Layers3 />
                    Pipeline
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/projects/${projectId}/console`}>
                    <Bot />
                    Open Asset Studio
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                [metrics.eventCount, "Loaded events", Activity],
                [metrics.completedRuns, "Completed runs", GitBranch],
                [metrics.artifacts, "Loaded assets", FileText],
                [metrics.reversible, "Compensatable actions", RotateCcw],
              ] satisfies Array<[number, string, LucideIcon]>).map(
                ([value, label, Icon]) => (
                <Card key={String(label)}>
                  <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <CardTitle className="text-sm">{label}</CardTitle>
                    <Icon className="size-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{value}</p>
                  </CardContent>
                </Card>
                ),
              )}
            </div>

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Replayable event stream</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select an event to inspect provenance and correlation.
                      </p>
                    </div>
                    <Badge variant="secondary">{events.length} loaded</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <WorkspaceTimeline
                    events={events}
                    onReplayFrom={createReplayPlan}
                  />
                  {nextCursor ? (
                    <div className="mt-5 flex justify-center border-t pt-5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void loadMore()}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? <Spinner /> : <History />}
                        {isLoadingMore ? "Loading…" : "Load older events"}
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      Replay semantics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        1
                      </span>
                      <p>Select a historical workflow event and request a replay plan.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        2
                      </span>
                      <p>
                        The console compares current evidence with the original run
                        before proposing steps.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        3
                      </span>
                      <p>
                        Replay creates a new correlated run. Historical events are
                        never edited.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent workflow runs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {runs.length ? (
                      runs.slice(0, 8).map((run) => (
                        <div key={run.id} className="rounded-xl border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-xs font-semibold">
                              {run.objective}
                            </p>
                            <Badge
                              variant="outline"
                              className="shrink-0 capitalize"
                            >
                              {run.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                            {run.status === "completed" ? (
                              <CheckCircle2 className="size-3 text-emerald-600" />
                            ) : (
                              <GitBranch className="size-3" />
                            )}
                            <span>{run.current_agent ?? "orchestrator"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        Asset Studio workflows will appear here.
                      </p>
                    )}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-between"
                    >
                      <Link href={`/projects/${projectId}/console`}>
                        Start a new run
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
