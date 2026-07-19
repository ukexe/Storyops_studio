"use client"

import {
  AlertCircle,
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  ChevronRight,
  Clock3,
  FileText,
  GitBranch,
  History,
  Layers3,
  PanelRight,
  RefreshCw,
  Send,
  Sparkles,
  TerminalSquare,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { toast } from "sonner"

import { ArtifactShelf } from "@/components/control-plane/ArtifactShelf"
import { WorkflowTrace } from "@/components/control-plane/WorkflowTrace"
import { WorkspaceTimeline } from "@/components/control-plane/WorkspaceTimeline"
import { Header } from "@/components/shared/Header"
import { WatsonxStatusBadge } from "@/components/shared/WatsonxStatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  ApiError,
  createConsoleTurn,
  getConversationMessages,
  getProject,
  getProjectArtifacts,
  getProjectConversations,
  getProjectWorkflowRuns,
  getWorkspaceEvents,
} from "@/lib/api"
import type {
  Artifact,
  Conversation,
  ConversationMessage,
  Project,
  UIIntent,
  WorkflowRun,
  WorkflowStep,
  WorkspaceEvent,
} from "@/types"

type InspectorTab = "run" | "artifacts" | "timeline"

const QUICK_COMMANDS = [
  "Analyze my uploaded documents",
  "Recommend the next action",
  "Why did confidence decrease?",
  "Show failed pipeline stage",
  "Generate an executive impact report",
  "Generate architecture and deployment plan",
]

function messageTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function replaceById<T extends { id: string }>(current: T[], value: T) {
  const found = current.some((candidate) => candidate.id === value.id)
  return found
    ? current.map((candidate) => (candidate.id === value.id ? value : candidate))
    : [value, ...current]
}

export default function ProjectConsolePage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  )
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [events, setEvents] = useState<WorkspaceEvent[]>([])
  const [latestSteps, setLatestSteps] = useState<WorkflowStep[]>([])
  const [uiIntents, setUiIntents] = useState<UIIntent[]>([])
  const [composer, setComposer] = useState("")
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("run")
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [turnError, setTurnError] = useState<string | null>(null)

  const latestRun = runs[0] ?? null

  const loadWorkspace = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [
          projectResponse,
          conversationResponse,
          artifactResponse,
          runResponse,
          eventResponse,
        ] = await Promise.all([
          getProject(projectId, signal),
          getProjectConversations(projectId, signal),
          getProjectArtifacts(projectId, signal),
          getProjectWorkflowRuns(projectId, signal),
          getWorkspaceEvents(projectId, null, signal),
        ])
        setProject(projectResponse)
        setConversations(conversationResponse)
        setArtifacts(artifactResponse)
        setRuns(runResponse)
        setEvents(eventResponse.events)
        const firstConversation = conversationResponse[0]
        if (firstConversation) {
          setActiveConversationId(firstConversation.id)
          setMessages(
            await getConversationMessages(firstConversation.id, signal),
          )
        }
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
            : "Unable to load the operating console.",
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
      void loadWorkspace(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadWorkspace])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const key = `storyops-console-draft:${projectId}`
      const draft = sessionStorage.getItem(key)
      if (draft) {
        setComposer(draft)
        sessionStorage.removeItem(key)
        composerRef.current?.focus()
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages, pendingMessage])

  async function selectConversation(conversationId: string) {
    if (
      conversationId === activeConversationId ||
      isSwitchingConversation ||
      isSending
    ) {
      return
    }
    setIsSwitchingConversation(true)
    setTurnError(null)
    try {
      setMessages(await getConversationMessages(conversationId))
      setActiveConversationId(conversationId)
      setLatestSteps([])
      setUiIntents([])
    } catch (caught) {
      setTurnError(
        caught instanceof Error
          ? caught.message
          : "Unable to load this conversation.",
      )
    } finally {
      setIsSwitchingConversation(false)
    }
  }

  async function sendCommand(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const message = composer.trim()
    if (!message || isSending) return

    setTurnError(null)
    setIsSending(true)
    setPendingMessage(message)
    setComposer("")
    try {
      const result = await createConsoleTurn(projectId, {
        message,
        conversation_id: activeConversationId,
        context: {
          current_page: window.location.pathname,
          selected_project_id: projectId,
          inspector_tab: inspectorTab,
        },
      })
      setActiveConversationId(result.conversation.id)
      setConversations((current) =>
        replaceById(current, result.conversation),
      )
      setMessages((current) => [
        ...current,
        result.user_message,
        result.assistant_message,
      ])
      setRuns((current) => replaceById(current, result.run))
      setLatestSteps(result.steps)
      setArtifacts((current) => [
        ...result.artifacts,
        ...current.filter(
          (artifact) =>
            !result.artifacts.some((created) => created.id === artifact.id),
        ),
      ])
      setUiIntents(result.ui_intents)
      setInspectorTab(result.artifacts.length ? "artifacts" : "run")
      const eventResponse = await getWorkspaceEvents(projectId)
      setEvents(eventResponse.events)
      toast.success("Console run completed", {
        description: `${result.steps.length} transparent steps recorded.`,
      })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        )
        return
      }
      setComposer(message)
      setTurnError(
        caught instanceof Error
          ? caught.message
          : "The operating-console request failed.",
      )
    } finally {
      setPendingMessage(null)
      setIsSending(false)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendCommand()
    }
  }

  function setCommandDraft(command: string) {
    setComposer(command)
    window.requestAnimationFrame(() => composerRef.current?.focus())
  }

  function retryLoad() {
    setIsLoading(true)
    setLoadError(null)
    void loadWorkspace()
  }

  const groupedMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  )

  return (
    <div className="min-h-screen bg-muted/15">
      <Header
        context={
          <span className="block max-w-48 truncate">
            {project?.name ?? "AI operating console"}
          </span>
        }
      >
        <WatsonxStatusBadge />
      </Header>

      <main className="mx-auto max-w-[1720px] px-3 py-5 sm:px-5">
        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-10 w-80 max-w-full" />
            <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_360px]">
              <Skeleton className="h-[720px]" />
              <Skeleton className="h-[720px]" />
              <Skeleton className="h-[720px]" />
            </div>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Operating console unavailable</AlertTitle>
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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <TerminalSquare className="size-3" />
                    IP Foundry control plane
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Context-aware · tool-transparent · artifact-native
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  AI operating console
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Ask about this workspace, inspect transparent delegation, and
                  turn useful answers into durable artifacts and timeline evidence.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${projectId}`}>
                    <Layers3 />
                    Pipeline
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${projectId}/tasks`}>
                    <Boxes />
                    Tasks
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${projectId}/timeline`}>
                    <History />
                    Timeline
                  </Link>
                </Button>
              </div>
            </div>

            {turnError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle />
                <AlertTitle>Console request failed</AlertTitle>
                <AlertDescription>{turnError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid items-stretch gap-3 xl:grid-cols-[250px_minmax(0,1fr)_360px]">
              <aside className="order-2 rounded-2xl border bg-card xl:order-1">
                <div className="border-b p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Conversations</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setActiveConversationId(null)
                        setMessages([])
                        setLatestSteps([])
                        setUiIntents([])
                        composerRef.current?.focus()
                      }}
                      disabled={isSending}
                    >
                      New
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto p-2 xl:max-h-72">
                  {conversations.length ? (
                    conversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() => void selectConversation(conversation.id)}
                        disabled={isSwitchingConversation || isSending}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          conversation.id === activeConversationId
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span className="block truncate text-xs font-medium">
                          {conversation.title}
                        </span>
                        <span className="mt-1 block font-mono text-[9px]">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Your first command starts a durable conversation.
                    </p>
                  )}
                </div>

                <div className="border-t p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Command library
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {QUICK_COMMANDS.map((command) => (
                      <button
                        type="button"
                        key={command}
                        onClick={() => setCommandDraft(command)}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[11px] leading-4 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Sparkles className="mt-0.5 size-3 shrink-0" />
                        <span>{command}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="order-1 flex min-h-[720px] min-w-0 flex-col overflow-hidden rounded-2xl border bg-card xl:order-2">
                <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <BrainCircuit className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">Workspace orchestrator</p>
                      <p className="text-[10px] text-muted-foreground">
                        Aware of {Object.values(project.item_counts).reduce((a, b) => a + b, 0)} items
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {isSending ? <Spinner /> : <Clock3 />}
                    {isSending ? "Running" : "Ready"}
                  </Badge>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {groupedMessages.length === 0 && !pendingMessage ? (
                    <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Bot className="size-5" />
                      </span>
                      <h2 className="mt-4 text-lg font-semibold">
                        Operate {project.name} through conversation
                      </h2>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                        I can inspect current items, analyses, tasks, runs, and
                        artifacts. Report and architecture requests become reusable
                        workspace assets with explicit model and confidence metadata.
                      </p>
                      <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                        {QUICK_COMMANDS.slice(0, 4).map((command) => (
                          <button
                            type="button"
                            key={command}
                            onClick={() => setCommandDraft(command)}
                            className="rounded-xl border bg-background p-3 text-left text-xs hover:border-primary/35 hover:bg-primary/5"
                          >
                            <Sparkles className="mb-2 size-3.5 text-primary" />
                            {command}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {groupedMessages.map((message) => {
                        const isUser = message.role === "user"
                        return (
                          <article
                            key={message.id}
                            className={`flex gap-3 ${
                              isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isUser ? (
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Bot className="size-4" />
                              </span>
                            ) : null}
                            <div
                              className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                                isUser
                                  ? "bg-primary text-primary-foreground"
                                  : "border bg-background"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.content}
                              </p>
                              <div
                                className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] ${
                                  isUser
                                    ? "text-primary-foreground/65"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span>{messageTime(message.created_at)}</span>
                                {message.agent_type ? (
                                  <span className="capitalize">
                                    {message.agent_type.replaceAll("_", " ")}
                                  </span>
                                ) : null}
                                {message.model_id ? (
                                  <span className="font-mono">
                                    {message.model_id}
                                  </span>
                                ) : null}
                              </div>
                              {!isUser && message.tool_calls.length ? (
                                <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                                  {message.tool_calls.map((tool) => (
                                    <Badge
                                      key={`${message.id}-${tool.sequence}`}
                                      variant="secondary"
                                      className="font-mono text-[9px]"
                                    >
                                      <GitBranch className="size-2.5" />
                                      {tool.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            {isUser ? (
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border bg-background">
                                <UserRound className="size-4" />
                              </span>
                            ) : null}
                          </article>
                        )
                      })}

                      {pendingMessage ? (
                        <>
                          <div className="flex justify-end gap-3">
                            <div className="max-w-[88%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
                              <p className="text-sm leading-6">{pendingMessage}</p>
                              <p className="mt-2 text-[9px] text-primary-foreground/65">
                                Sending…
                              </p>
                            </div>
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border bg-background">
                              <UserRound className="size-4" />
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                              <Bot className="size-4" />
                            </span>
                            <div className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-xs text-muted-foreground">
                              <Spinner />
                              Building context and delegating work…
                            </div>
                          </div>
                        </>
                      ) : null}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {uiIntents.length ? (
                  <div className="border-t bg-primary/5 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Suggested workspace action
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uiIntents.map((intent) => (
                        <Button
                          key={`${intent.type}-${intent.target}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (intent.type === "navigate") {
                              router.push(intent.target)
                            } else {
                              toast.info(intent.label)
                            }
                          }}
                        >
                          {intent.label}
                          <ArrowRight />
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <form onSubmit={sendCommand} className="border-t bg-background p-3">
                  <div className="rounded-2xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring/50">
                    <Textarea
                      ref={composerRef}
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Ask, analyze, explain, generate, or navigate…"
                      rows={3}
                      maxLength={20_000}
                      disabled={isSending}
                      className="min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                      aria-label="Operating-console command"
                    />
                    <div className="flex items-center justify-between gap-3 px-1 pb-1">
                      <p className="text-[9px] text-muted-foreground">
                        Enter to send · Shift Enter for a new line
                      </p>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSending || !composer.trim()}
                      >
                        {isSending ? <Spinner /> : <Send />}
                        {isSending ? "Running" : "Send"}
                      </Button>
                    </div>
                  </div>
                </form>
              </section>

              <aside className="order-3 overflow-hidden rounded-2xl border bg-card">
                <div className="border-b p-2">
                  <div
                    className="grid grid-cols-3 gap-1"
                    role="tablist"
                    aria-label="Console inspector"
                  >
                    {(
                      [
                        ["run", "Run", PanelRight],
                        ["artifacts", "Artifacts", FileText],
                        ["timeline", "Timeline", History],
                      ] as const
                    ).map(([value, label, Icon]) => (
                      <Button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={inspectorTab === value}
                        variant={inspectorTab === value ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setInspectorTab(value)}
                        className="px-2 text-xs"
                      >
                        <Icon />
                        <span className="hidden sm:inline xl:hidden 2xl:inline">
                          {label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="max-h-[680px] overflow-y-auto p-3">
                  {inspectorTab === "run" ? (
                    <WorkflowTrace run={latestRun} steps={latestSteps} />
                  ) : null}
                  {inspectorTab === "artifacts" ? (
                    <ArtifactShelf artifacts={artifacts} />
                  ) : null}
                  {inspectorTab === "timeline" ? (
                    <WorkspaceTimeline
                      events={events}
                      compact
                      onReplayFrom={(event) =>
                        setCommandDraft(
                          `Continue previous workflow from run ${event.run_id} and explain what will be replayed before taking action.`,
                        )
                      }
                    />
                  ) : null}
                </div>
                <div className="border-t p-3">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <Link href={`/projects/${projectId}/timeline`}>
                      Open full timeline
                      <ChevronRight />
                    </Link>
                  </Button>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
