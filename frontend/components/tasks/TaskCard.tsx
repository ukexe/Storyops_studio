"use client"

import { Link2, LoaderCircle } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Priority, Task, TaskStatus } from "@/types"

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  medium:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  high: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
]

interface TaskCardProps {
  task: Task
  isUpdating: boolean
  onStatusChange: (status: TaskStatus) => void
}

export function TaskCard({
  task,
  isUpdating,
  onStatusChange,
}: TaskCardProps) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="min-w-0 flex-1 break-words text-sm leading-5">
            {task.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 capitalize ${PRIORITY_CLASSES[task.priority]}`}
          >
            {task.priority} priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {task.description ? (
          <p className="break-words text-sm leading-5 text-muted-foreground">
            {task.description}
          </p>
        ) : null}

        {task.linked_item_id ? (
          <Link
            href={`/projects/${task.project_id}/items/${task.linked_item_id}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Link2 className="size-3.5 shrink-0" />
            <span className="truncate">
              {task.linked_item_title || "View linked item"}
            </span>
          </Link>
        ) : null}

        <div
          className="grid grid-cols-3 gap-1"
          role="group"
          aria-label={`Change status for ${task.title}`}
        >
          {STATUS_OPTIONS.map((option) => {
            const isActive = task.status === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="xs"
                className="min-w-0 px-1 text-[11px]"
                aria-pressed={isActive}
                disabled={isUpdating || isActive}
                onClick={() => onStatusChange(option.value)}
              >
                {isUpdating && isActive ? (
                  <LoaderCircle className="animate-spin" />
                ) : null}
                <span className="truncate">{option.label}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
