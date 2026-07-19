"use client"

import { Check, Copy, Download, FileText, PackageOpen } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Artifact } from "@/types"

function safeFilename(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "storyops-artifact"
  )
}

export function ArtifactShelf({ artifacts }: { artifacts: Artifact[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    artifacts[0]?.id ?? null,
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const selected =
    artifacts.find((artifact) => artifact.id === selectedId) ?? artifacts[0]

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
        <PackageOpen className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No reusable artifacts yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask for an executive report, architecture brief, or roadmap.
        </p>
      </div>
    )
  }

  async function copyArtifact(artifact: Artifact) {
    await navigator.clipboard.writeText(artifact.content)
    setCopiedId(artifact.id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  function downloadArtifact(artifact: Artifact) {
    const blob = new Blob([artifact.content], {
      type: "text/markdown;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${safeFilename(artifact.title)}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {artifacts.map((artifact) => (
          <button
            type="button"
            key={artifact.id}
            onClick={() => setSelectedId(artifact.id)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              selected?.id === artifact.id
                ? "border-primary/40 bg-primary/5"
                : "bg-background hover:border-foreground/20"
            }`}
            aria-pressed={selected?.id === artifact.id}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">
                  {artifact.title}
                </span>
                <span className="mt-1 block font-mono text-[9px] text-muted-foreground">
                  {artifact.type} · v{artifact.version}
                </span>
              </span>
              <Badge variant="outline" className="capitalize">
                {artifact.status}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="rounded-xl border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold">Artifact preview</p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => void copyArtifact(selected)}
                aria-label={`Copy ${selected.title}`}
                title="Copy artifact"
              >
                {copiedId === selected.id ? <Check /> : <Copy />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => downloadArtifact(selected)}
                aria-label={`Download ${selected.title}`}
                title="Download Markdown"
              >
                <Download />
              </Button>
            </div>
          </div>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 font-sans text-[11px] leading-5 text-muted-foreground">
            {selected.content}
          </pre>
          <p className="mt-2 truncate font-mono text-[9px] text-muted-foreground">
            Model: {String(selected.metadata.model_id ?? "not recorded")}
          </p>
        </div>
      ) : null}
    </div>
  )
}
