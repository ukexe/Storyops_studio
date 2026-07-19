"use client"

import { AlertCircle, Bot, RefreshCw, WandSparkles } from "lucide-react"

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
import { Spinner } from "@/components/ui/spinner"
import type { Analysis, Priority } from "@/types"

const PRIORITY_CLASSES: Record<Priority, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-800",
}

function metricLabel(key: string) {
  const label = key.replaceAll("_", " ")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function metricValue(value: unknown): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value)
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "string") {
    return value
  }
  if (value == null) {
    return "Not set"
  }
  try {
    return JSON.stringify(value)
  } catch {
    return "Structured value"
  }
}

interface AnalysisPanelProps {
  analysis: Analysis | null
  isAnalyzing: boolean
  onAnalyze: () => void
  error?: string | null
}

export function AnalysisPanel({
  analysis,
  isAnalyzing,
  onAnalyze,
  error,
}: AnalysisPanelProps) {
  const metrics = analysis ? Object.entries(analysis.score_metrics) : []

  return (
    <Card aria-busy={isAnalyzing}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="size-4" />
          AI analysis
        </CardTitle>
        <CardDescription>
          Structured insights from the agent assigned to this item type.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!analysis && isAnalyzing ? (
          <div
            className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center"
            role="status"
            aria-live="polite"
          >
            <Spinner className="size-6" />
            <p className="mt-4 text-sm font-medium">
              Running the assigned StoryOps agent…
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This usually takes a few seconds.
            </p>
          </div>
        ) : null}

        {!analysis && !isAnalyzing ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-5" />
            </div>
            <h2 className="mt-4 text-sm font-semibold">No analysis yet</h2>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Run the StoryOps agent to identify quality signals,
              recommendations, and follow-up tasks.
            </p>
            <Button className="mt-5" onClick={onAnalyze}>
              <WandSparkles />
              Analyze item
            </Button>
          </div>
        ) : null}

        {analysis ? (
          <>
            {isAnalyzing ? (
              <div
                className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Spinner />
                Re-running the assigned StoryOps agent…
              </div>
            ) : null}

            <section aria-labelledby="analysis-summary">
              <h2 id="analysis-summary" className="text-sm font-semibold">
                Summary
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {analysis.summary}
              </p>
            </section>

            <section aria-labelledby="analysis-metrics">
              <h2 id="analysis-metrics" className="text-sm font-semibold">
                Score metrics
              </h2>
              {metrics.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {metrics.map(([key, value]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="max-w-full gap-1.5 whitespace-normal"
                    >
                      <span className="text-muted-foreground">
                        {metricLabel(key)}:
                      </span>
                      <span className="break-all">{metricValue(value)}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  This agent does not emit score metrics yet.
                </p>
              )}
            </section>

            <section aria-labelledby="analysis-recommendations">
              <h2
                id="analysis-recommendations"
                className="text-sm font-semibold"
              >
                Recommendations
              </h2>
              {analysis.recommendations.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li
                      key={`${recommendation.title}-${index}`}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="break-words text-sm font-medium">
                          {recommendation.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`capitalize ${PRIORITY_CLASSES[recommendation.priority]}`}
                        >
                          {recommendation.priority} priority
                        </Badge>
                      </div>
                      <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                        {recommendation.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No recommendations were generated for this item.
                </p>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Model: {analysis.model_id}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? <Spinner /> : <RefreshCw />}
                {isAnalyzing ? "Analyzing…" : "Re-analyze"}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
