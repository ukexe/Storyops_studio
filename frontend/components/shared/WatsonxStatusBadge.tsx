"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getHealth } from "@/lib/api"
import type { WatsonxStatus } from "@/types"

type BadgeState = WatsonxStatus | "checking" | "fallback"

export function WatsonxStatusBadge() {
  const [state, setState] = useState<BadgeState>("checking")

  const checkHealth = useCallback(async (signal?: AbortSignal) => {
    try {
      const health = await getHealth(signal)
      setState(
        health.analysis_mode === "edge-rules" ? "fallback" : health.watsonx,
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
      <Badge variant="outline" className="gap-1.5 text-emerald-700">
        <CircleCheck className="size-3.5" />
        watsonx connected
      </Badge>
    )
  }

  if (state === "fallback") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-amber-700"
        title="Deterministic agents are active; configure watsonx credentials for Granite inference."
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
        Checking watsonx
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
      aria-label="Retry watsonx connectivity check"
    >
      <Badge variant="outline" className="gap-1.5 text-amber-700">
        <CircleAlert className="size-3.5" />
        watsonx unavailable
      </Badge>
    </button>
  )
}
