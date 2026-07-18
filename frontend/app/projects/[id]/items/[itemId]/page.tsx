"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  ChevronRight,
  ExternalLink,
  FileQuestion,
  RefreshCw,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { AnalysisPanel } from "@/components/items/AnalysisPanel"
import { Header } from "@/components/shared/Header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { analyzeItem, ApiError, getItem, getProject } from "@/lib/api"
import type { Analysis, Item, Project } from "@/types"

export default function ItemDetailPage() {
  const { id: projectId, itemId } = useParams<{
    id: string
    itemId: string
  }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const loadItem = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [projectResponse, itemResponse] = await Promise.all([
          getProject(projectId, signal),
          getItem(itemId, signal),
        ])
        if (itemResponse.project_id !== projectId) {
          throw new ApiError(404, "Item not found in this project.")
        }
        setProject(projectResponse)
        setItem(itemResponse)
        setAnalysis(itemResponse.latest_analysis)
        setAnalysisError(null)
        setImageFailed(false)
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
          caught instanceof Error ? caught.message : "Unable to load this item.",
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [itemId, projectId, router],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadItem(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadItem])

  function retryLoad() {
    setLoadError(null)
    setIsLoading(true)
    void loadItem()
  }

  async function handleAnalyze() {
    if (isAnalyzing) {
      return
    }
    setAnalysisError(null)
    setIsAnalyzing(true)
    try {
      const result = await analyzeItem(itemId)
      setAnalysis(result)
      toast.success("Analysis complete", {
        description: `${result.recommendations.length} recommendations generated.`,
      })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        )
        return
      }
      setAnalysisError(
        caught instanceof Error
          ? caught.message
          : "Unable to analyze this item.",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/15">
      <Header
        context={
          <span className="block max-w-48 truncate">
            {project?.name ?? "Item detail"}
          </span>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-80 max-w-full" />
            <Skeleton className="mt-7 h-10 w-96 max-w-full" />
            <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
              <Skeleton className="h-[520px]" />
              <Skeleton className="h-[420px]" />
            </div>
          </>
        ) : null}

        {!isLoading && loadError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Item unavailable</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-4">
              <span>{loadError}</span>
              <Button variant="outline" size="sm" onClick={retryLoad}>
                <RefreshCw />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !loadError && item && project ? (
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
              <span
                className="truncate font-medium text-foreground"
                aria-current="page"
              >
                {item.title}
              </span>
            </nav>

            <div className="mb-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {item.type}
                </Badge>
                <Badge variant="outline">{item.stage}</Badge>
              </div>
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.title}
              </h1>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>
                    Source material attached to this pipeline item.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {item.file_url && !imageFailed ? (
                    <div className="relative aspect-video max-h-[620px] overflow-hidden rounded-xl border bg-muted/30">
                      <Image
                        src={item.file_url}
                        alt={`${item.title} creative asset`}
                        fill
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="object-contain"
                        onError={() => setImageFailed(true)}
                      />
                    </div>
                  ) : null}

                  {item.file_url && imageFailed ? (
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                      <FileQuestion className="size-6 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium">
                        Preview unavailable
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        The asset may be private or no longer available.
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open original
                          <ExternalLink />
                        </a>
                      </Button>
                    </div>
                  ) : null}

                  {item.content ? (
                    <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/20 p-4 font-sans text-sm leading-6">
                      {item.content}
                    </pre>
                  ) : null}

                  {!item.file_url && !item.content ? (
                    <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      This item has no text or asset content yet.
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <AnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
                error={analysisError}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
