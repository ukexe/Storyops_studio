import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Pause,
  ShieldQuestion,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { WorkflowRun, WorkflowStep, WorkflowStepStatus } from "@/types"

const STEP_META: Record<
  WorkflowStepStatus,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  pending: {
    icon: CircleDashed,
    className: "text-muted-foreground",
    label: "Pending",
  },
  running: {
    icon: LoaderCircle,
    className: "animate-spin text-primary",
    label: "Running",
  },
  waiting_approval: {
    icon: ShieldQuestion,
    className: "text-amber-600 dark:text-amber-400",
    label: "Waiting approval",
  },
  completed: {
    icon: CheckCircle2,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "Completed",
  },
  failed: {
    icon: AlertCircle,
    className: "text-destructive",
    label: "Failed",
  },
  skipped: {
    icon: Pause,
    className: "text-muted-foreground",
    label: "Skipped",
  },
}

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function scalarEntries(value: Record<string, unknown>) {
  return Object.entries(value).filter(
    ([, entry]) =>
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean",
  )
}

export function WorkflowTrace({
  run,
  steps,
}: {
  run: WorkflowRun | null
  steps: WorkflowStep[]
}) {
  if (!run) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
        <CircleDashed className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No active run</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Send a command to see objective, tools, agents, and confidence.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className="capitalize">
            {run.status.replaceAll("_", " ")}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground">
            {run.progress}% complete
          </span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-5">{run.objective}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${run.progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>Agent: {run.current_agent ?? "orchestrator"}</span>
          <span>
            Confidence:{" "}
            {run.confidence == null
              ? "pending"
              : `${Math.round(run.confidence * 100)}%`}
          </span>
          {run.model_id ? <span>Model: {run.model_id}</span> : null}
          {run.prompt_version ? <span>Prompt: {run.prompt_version}</span> : null}
        </div>
        {run.replayed_from_run_id ? (
          <p className="mt-3 rounded-lg border bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground">
            Replayed from {run.replayed_from_run_id}
          </p>
        ) : null}
        {run.error ? (
          <p className="mt-3 text-xs text-destructive">
            Run stopped: {run.error}
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step) => {
          const meta = STEP_META[step.status]
          const Icon = meta.icon
          return (
            <div key={step.id} className="rounded-xl border bg-background p-3">
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 size-4 shrink-0 ${meta.className}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-semibold">
                      {step.agent_type.replaceAll("_", " ")}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      {meta.label}
                    </span>
                  </div>
                  {step.tool_name ? (
                    <p className="mt-1 truncate font-mono text-[10px] text-primary">
                      {step.tool_name}
                    </p>
                  ) : null}
                  {step.confidence != null ? (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Confidence {Math.round(step.confidence * 100)}%
                    </p>
                  ) : null}
                  {step.dependencies.length ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Depends on step {step.dependencies.join(", ")}
                    </p>
                  ) : null}
                  {scalarEntries(step.output_data).length ? (
                    <dl className="mt-3 grid gap-2 border-t pt-3 text-[10px] sm:grid-cols-2">
                      {scalarEntries(step.output_data).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-muted-foreground">{label(key)}</dt>
                          <dd className="mt-0.5 break-words font-mono">
                            {String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
