"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getHealth } from "@/lib/api"
import type { WatsonxStatus } from "@/types"

type BadgeState = WatsonxStatus | "checking" | "fallback" | "openai"

export function ProviderStatusBadge() {
  const [state, setState] = useState<BadgeState>("checking")

  const checkHealth = useCallback(async (signal?: AbortSignal) => {
    try {
      const health = await getHealth(signal)
      setState(
        health.analysis_mode === "openai"
          ? "openai"
          : health.analysis_mode === "edge-rules"
            ? "fallback"
            : health.watsonx,
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setState("error")
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void checkHealth(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [checkHealth])

  if (state === "connected") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-emerald-700 dark:text-emerald-300"
      >
        <CircleCheck className="size-3.5" />
        watsonx connected
      </Badge>
    )
  }

  if (state === "openai") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-emerald-700 dark:text-emerald-300"
        title="OpenAI is configured as the production analysis provider."
      >
        <CircleCheck className="size-3.5" />
        OpenAI configured
      </Badge>
    )
  }

  if (state === "fallback") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-amber-700 dark:text-amber-300"
        title="Deterministic agents are active because no hosted model provider is configured."
      >
        <CircleCheck className="size-3.5" />
        Edge agents active
      </Badge>
    )
  }

  if (state === "checking" || state === "unknown") {
    return (
      <Badge variant="outline" className="gap-1.5 text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" />
        Checking AI runtime
      </Badge>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setState("checking")
        void checkHealth()
      }}
      aria-label="Retry AI provider connectivity check"
    >
      <Badge
        variant="outline"
        className="gap-1.5 text-amber-700 dark:text-amber-300"
      >
        <CircleAlert className="size-3.5" />
        AI provider unavailable
      </Badge>
    </button>
  )
}
