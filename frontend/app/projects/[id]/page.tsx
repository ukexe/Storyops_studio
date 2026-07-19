"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, Bot, History, ListTodo, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { AddItemSheet } from "@/components/pipeline/AddItemSheet"
import { PipelineBoard } from "@/components/pipeline/PipelineBoard"
import { Header } from "@/components/shared/Header"
import { WatsonxStatusBadge } from "@/components/shared/WatsonxStatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, getProject, getProjectItems } from "@/lib/api"
import {
  PIPELINE_STAGES,
  type Item,
  type ItemsByStage,
  type PipelineStage,
  type Project,
} from "@/types"

function emptyPipeline(): ItemsByStage {
  return {
    Idea: [],
    Script: [],
    Assets: [],
    Edit: [],
    Feedback: [],
    Publish: [],
    Analyze: [],
  }
}

function normalizePipeline(items: ItemsByStage): ItemsByStage {
  return {
    Idea: items.Idea ?? [],
    Script: items.Script ?? [],
    Assets: items.Assets ?? [],
    Edit: items.Edit ?? [],
    Feedback: items.Feedback ?? [],
    Publish: items.Publish ?? [],
    Analyze: items.Analyze ?? [],
  }
}

export default function ProjectPipelinePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [itemsByStage, setItemsByStage] =
    useState<ItemsByStage>(emptyPipeline)
  const [addingToStage, setAddingToStage] = useState<PipelineStage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadPipeline = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [projectResponse, itemsResponse] = await Promise.all([
          getProject(projectId, signal),
          getProjectItems(projectId, signal),
        ])
        setProject(projectResponse)
        setItemsByStage(normalizePipeline(itemsResponse))
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return
        }
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login")
          return
        }
        setLoadError(
          caught instanceof Error
            ? caught.message
            : "Unable to load this pipeline.",
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
      void loadPipeline(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadPipeline])

  const itemCount = useMemo(
    () =>
      PIPELINE_STAGES.reduce(
        (total, stage) => total + itemsByStage[stage].length,
        0,
      ),
    [itemsByStage],
  )

  function retryLoad() {
    setLoadError(null)
    setIsLoading(true)
    void loadPipeline()
  }

  function handleItemCreated(item: Item) {
    setItemsByStage((current) => ({
      ...current,
      [item.stage]: [...current[item.stage], item],
    }))
  }

  return (
    <div className="min-h-screen bg-muted/15">
      <Header
        context={
          <span className="block max-w-48 truncate">
            {project?.name ?? "Project pipeline"}
          </span>
        }
      >
        <WatsonxStatusBadge />
      </Header>

      <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
            <div className="mt-8 flex gap-3 overflow-hidden">
              {PIPELINE_STAGES.map((stage) => (
                <Skeleton key={stage} className="h-96 w-[290px] shrink-0" />
              ))}
            </div>
          </>
        ) : null}

        {!isLoading && loadError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Pipeline unavailable</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
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
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">Pipeline</Badge>
                  <span className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {project.name}
                </h1>
                {project.description ? (
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    {project.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/projects/${project.id}/console`}>
                    <Bot />
                    AI console
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.id}/tasks`}>
                    <ListTodo />
                    Tasks
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden md:inline-flex"
                >
                  <Link href={`/projects/${project.id}/timeline`}>
                    <History />
                    Timeline
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={retryLoad}>
                  <RefreshCw />
                  Refresh
                </Button>
              </div>
            </div>

            <PipelineBoard
              itemsByStage={itemsByStage}
              onAddItem={setAddingToStage}
            />
          </>
        ) : null}
      </main>

      {addingToStage ? (
        <AddItemSheet
          key={addingToStage}
          projectId={projectId}
          stage={addingToStage}
          onClose={() => setAddingToStage(null)}
          onCreated={handleItemCreated}
        />
      ) : null}
    </div>
  )
}
