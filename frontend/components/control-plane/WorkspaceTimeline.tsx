"use client"

import {
  Activity,
  Bot,
  ChevronRight,
  CircleUserRound,
  Cog,
  GitBranch,
  Search,
  Wrench,
} from "lucide-react"
import { useMemo, useState } from "react"

import { RichContent } from "@/components/ai/RichContent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkspaceEvent, WorkspaceEventSource } from "@/types"

const SOURCE_META: Record<
  WorkspaceEventSource,
  { label: string; icon: typeof Activity; className: string }
> = {
  user: {
    label: "User",
    icon: CircleUserRound,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  agent: {
    label: "Agent",
    icon: Bot,
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  tool: {
    label: "Tool",
    icon: Wrench,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  workflow: {
    label: "Workflow",
    icon: GitBranch,
    className: "bg-primary/10 text-primary",
  },
  system: {
    label: "System",
    icon: Cog,
    className: "bg-muted text-muted-foreground",
  },
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

function eventDetails(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .map(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [key, String(value)] as const
      }
      if (
        Array.isArray(value) &&
        value.every((entry) => ["string", "number", "boolean"].includes(typeof entry))
      ) {
        return [key, value.join(", ")] as const
      }
      return null
    })
    .filter((entry): entry is readonly [string, string] => entry !== null)
    .slice(0, 8)
}

interface WorkspaceTimelineProps {
  events: WorkspaceEvent[]
  compact?: boolean
  onReplayFrom?: (event: WorkspaceEvent) => void
}

export function WorkspaceTimeline({
  events,
  compact = false,
  onReplayFrom,
}: WorkspaceTimelineProps) {
  const [source, setSource] = useState<"all" | WorkspaceEventSource>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return events.filter(
      (event) =>
        (source === "all" || event.source === source) &&
        (!normalized ||
          event.title.toLowerCase().includes(normalized) ||
          event.summary?.toLowerCase().includes(normalized) ||
          event.event_type.toLowerCase().includes(normalized)),
    )
  }, [events, query, source])

  const visible = compact ? filtered.slice(0, 8) : filtered

  return (
    <div>
      {!compact ? (
        <div className="mb-5 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search event evidence"
              className="pl-9"
              aria-label="Search workspace timeline"
            />
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter events by source"
          >
            {(["all", "user", "agent", "tool", "workflow", "system"] as const).map(
              (value) => (
                <Button
                  key={value}
                  type="button"
                  size="xs"
                  variant={source === value ? "default" : "outline"}
                  onClick={() => setSource(value)}
                  aria-pressed={source === value}
                  className="capitalize"
                >
                  {value}
                </Button>
              ),
            )}
          </div>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
          <Activity className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No matching events</p>
          <p className="mt-1 text-xs text-muted-foreground">
            New uploads, analyses, chat turns, tools, and artifacts appear here.
          </p>
        </div>
      ) : (
        <div className="relative space-y-3 pl-8">
          <div
            className="absolute bottom-3 left-[13px] top-3 w-px bg-border"
            aria-hidden
          />
          {visible.map((event) => {
            const meta = SOURCE_META[event.source]
            const Icon = meta.icon
            const selected = selectedId === event.id
            return (
              <article key={event.id} className="relative">
                <span
                  className={`absolute -left-8 top-3 flex size-7 items-center justify-center rounded-full border bg-background ${meta.className}`}
                >
                  <Icon className="size-3.5" />
                </span>
                <div
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-primary/40 bg-primary/5"
                      : "bg-background hover:border-foreground/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(selected ? null : event.id)}
                    className="flex w-full items-start gap-3 text-left"
                    aria-expanded={selected}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xs font-semibold">
                          {event.title}
                        </p>
                        {event.is_reversible ? (
                          <Badge
                            variant="outline"
                            className="h-5 rounded-full text-[9px]"
                          >
                            Reversible
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                        {timestamp(event.created_at)} · {meta.label}
                      </p>
                    </div>
                    <ChevronRight
                      className={`size-3.5 shrink-0 text-muted-foreground transition ${
                        selected ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                  {selected ? (
                    <div className="mt-3 space-y-3 border-t pt-3">
                      {event.summary ? (
                        <RichContent content={event.summary} compact />
                      ) : null}
                      <dl className="grid gap-2 text-[10px] sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">Event type</dt>
                          <dd className="mt-0.5 break-all font-mono">
                            {event.event_type}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Correlation</dt>
                          <dd className="mt-0.5 truncate font-mono">
                            {event.correlation_id}
                          </dd>
                        </div>
                        {event.model_id ? (
                          <div className="sm:col-span-2">
                            <dt className="text-muted-foreground">Model audit</dt>
                            <dd className="mt-0.5 break-all font-mono">
                              {event.model_id}
                            </dd>
                          </div>
                        ) : null}
                        <div>
                          <dt className="text-muted-foreground">Object</dt>
                          <dd className="mt-0.5 break-all font-mono">
                            {event.object_type}
                            {event.object_id
                              ? ` · ${event.object_id.slice(0, 8)}`
                              : ""}
                          </dd>
                        </div>
                        {event.causation_id ? (
                          <div>
                            <dt className="text-muted-foreground">Caused by</dt>
                            <dd className="mt-0.5 truncate font-mono">
                              {event.causation_id}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      {eventDetails(event.payload).length ? (
                        <dl className="grid gap-2 rounded-lg bg-muted/30 p-3 text-[10px] sm:grid-cols-2">
                          {eventDetails(event.payload).map(([key, value]) => (
                            <div key={key}>
                              <dt className="capitalize text-muted-foreground">
                                {key.replaceAll("_", " ")}
                              </dt>
                              <dd className="mt-0.5 break-words">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {onReplayFrom && event.run_id ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => onReplayFrom(event)}
                        >
                          <GitBranch />
                          Create replay plan
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
