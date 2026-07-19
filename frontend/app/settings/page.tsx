"use client"

import { BrainCircuit, Database, RefreshCw, Server, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/shared/Header"
import { WatsonxStatusBadge } from "@/components/shared/WatsonxStatusBadge"
import { getHealth } from "@/lib/api"
import type { HealthResponse } from "@/types"

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadHealth = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setHealth(await getHealth())
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load service status.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadHealth])

  const edgeFallback = health?.analysis_mode === "edge-rules"
  const openAIActive = health?.analysis_mode === "openai"

  return (
    <div className="min-h-screen bg-muted/20">
      <Header>
        <WatsonxStatusBadge />
      </Header>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline">Workspace configuration</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Review production connectivity, active analysis mode, and security
              boundaries. Secret values are managed only in the deployment
              platforms and are never exposed here.
            </p>
          </div>
          <Button variant="outline" onClick={loadHealth} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
            Refresh status
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Service status unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard
            icon={<Server />}
            title="StoryOps API"
            status={health?.status === "ok" ? "Operational" : "Checking"}
            detail="Cloudflare Worker REST adapter with authenticated ownership checks."
          />
          <StatusCard
            icon={<Database />}
            title="Supabase data"
            status={health?.database === "connected" ? "Connected" : "Checking"}
            detail="PostgreSQL, Supabase Auth, and private signed asset storage."
          />
          <StatusCard
            icon={<BrainCircuit />}
            title="Analysis runtime"
            status={
              openAIActive
                ? "OpenAI"
                : edgeFallback
                ? "Edge agents"
                : health?.watsonx === "connected"
                  ? "IBM Granite"
                  : "Checking"
            }
            detail={
              openAIActive
                ? `${health?.model_id ?? "OpenAI"} is active with deterministic edge fallback. Creative inputs are sent with API storage disabled.`
                : edgeFallback
                ? "Deterministic fallback agents are active and explicitly audited."
                : "The canonical watsonx.ai agent runtime is active."
            }
          />
          <StatusCard
            icon={<ShieldCheck />}
            title="Security boundary"
            status="Enforced"
            detail="JWT sessions, tenant ownership, private assets, RLS, and restricted browser grants."
          />
        </div>
      </main>
    </div>
  )
}

function StatusCard({
  icon,
  title,
  status,
  detail,
}: {
  icon: ReactNode
  title: string
  status: string
  detail: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <CardTitle>{title}</CardTitle>
        </div>
        <Badge variant="secondary">{status}</Badge>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {detail}
      </CardContent>
    </Card>
  )
}
