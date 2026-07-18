"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  FolderKanban,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog"
import { Header } from "@/components/shared/Header"
import { WatsonxStatusBadge } from "@/components/shared/WatsonxStatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ApiError, getProjects, seedDemo } from "@/lib/api"
import type { Project } from "@/types"

function projectItemTotal(project: Project) {
  return Object.values(project.item_counts).reduce(
    (total, count) => total + count,
    0,
  )
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const loadProjects = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setProjects(await getProjects(signal))
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return
        }
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace("/login")
          return
        }
        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load projects.",
        )
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [router],
  )

  function retryLoad() {
    setIsLoading(true)
    setLoadError(null)
    void loadProjects()
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadProjects(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadProjects])

  async function handleSeedDemo() {
    setSeedError(null)
    setIsSeeding(true)
    try {
      const { project_id } = await seedDemo()
      router.push(`/projects/${project_id}`)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/login")
        return
      }
      setSeedError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the demo project.",
      )
      setIsSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header>
        <WatsonxStatusBadge />
      </Header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3">
              Creative operations
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Coordinate every creative stage and turn AI analysis into
              production-ready tasks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleSeedDemo}
              disabled={isSeeding}
            >
              {isSeeding ? <Spinner /> : <Sparkles />}
              {isSeeding ? "Running three agents…" : "Seed demo"}
            </Button>
            <NewProjectDialog
              onCreated={(project) =>
                setProjects((current) => [project, ...current])
              }
            />
          </div>
        </div>

        {seedError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle />
            <AlertTitle>Demo seed failed</AlertTitle>
            <AlertDescription>{seedError}</AlertDescription>
          </Alert>
        ) : null}

        {loadError ? (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle />
            <AlertTitle>Projects unavailable</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={retryLoad}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {!isLoading && !loadError && projects.length === 0 ? (
          <Card className="mt-8 border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <FolderKanban className="size-5 text-muted-foreground" />
              </div>
              <h2 className="mt-4 font-semibold">No projects yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create a blank project or run the demo to see StoryOps agents
                analyze a complete creative pipeline.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="transition-colors hover:border-foreground/25"
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {projectItemTotal(project)} items
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatUpdatedAt(project.updated_at)}
                  </span>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/projects/${project.id}`}>
                      Open pipeline
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}
