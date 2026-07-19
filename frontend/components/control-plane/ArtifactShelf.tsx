"use client"

import {
  Check,
  Code2,
  Copy,
  Download,
  FileText,
  ImageIcon,
  Maximize2,
  Network,
  PackageOpen,
} from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"

import {
  CodeBlock,
  MermaidDiagram,
  RichContent,
} from "@/components/ai/RichContent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [expanded, setExpanded] = useState(false)
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
    try {
      await navigator.clipboard.writeText(artifact.content)
      setCopiedId(artifact.id)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      toast.error("Unable to copy this asset")
    }
  }

  async function downloadArtifact(artifact: Artifact) {
    if (artifact.format === "image" && artifact.content_url) {
      try {
        const response = await fetch(artifact.content_url)
        if (!response.ok) throw new Error()
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `${safeFilename(artifact.title)}.${artifact.mime_type?.split("/")[1] || "jpg"}`
        anchor.click()
        URL.revokeObjectURL(url)
        return
      } catch {
        window.open(artifact.content_url, "_blank", "noopener,noreferrer")
        return
      }
    }
    const extension: Record<Artifact["format"], string> = {
      markdown: "md",
      mermaid: "mmd",
      code: String(artifact.metadata.language ?? "txt"),
      json: "json",
      image: "txt",
      text: "txt",
    }
    const blob = new Blob([artifact.content], {
      type: `${artifact.mime_type ?? "text/plain"};charset=utf-8`,
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${safeFilename(artifact.title)}.${extension[artifact.format]}`
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
                <ArtifactIcon artifact={artifact} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">
                  {artifact.title}
                </span>
                <span className="mt-1 block font-mono text-[9px] text-muted-foreground">
                  {artifact.format} · v{artifact.version}
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
                onClick={() => void downloadArtifact(selected)}
                aria-label={`Download ${selected.title}`}
                title="Download asset"
              >
                <Download />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setExpanded(true)}
                aria-label={`Expand ${selected.title}`}
                title="Open large preview"
              >
                <Maximize2 />
              </Button>
            </div>
          </div>
          <div className="mt-3 max-h-[26rem] overflow-auto rounded-lg border bg-background p-3">
            <ArtifactPreview artifact={selected} compact />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground">
            <span>Model: {selected.model_id ?? "not recorded"}</span>
            {selected.content_sha256 ? (
              <span title={selected.content_sha256}>
                SHA-256 {selected.content_sha256.slice(0, 10)}…
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.type.replaceAll("_", " ")} · {selected.format} ·
                  version {selected.version}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 rounded-2xl border bg-background p-4 sm:p-6">
                <ArtifactPreview artifact={selected} />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ArtifactIcon({ artifact }: { artifact: Artifact }) {
  if (artifact.format === "image") return <ImageIcon className="size-4" />
  if (artifact.format === "mermaid") return <Network className="size-4" />
  if (artifact.format === "code" || artifact.format === "json") {
    return <Code2 className="size-4" />
  }
  return <FileText className="size-4" />
}

function ArtifactPreview({
  artifact,
  compact = false,
}: {
  artifact: Artifact
  compact?: boolean
}) {
  if (artifact.format === "image") {
    if (!artifact.content_url) {
      return (
        <div className="flex min-h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <ImageIcon className="size-6" />
          <p className="mt-3">The private image preview is temporarily unavailable.</p>
        </div>
      )
    }
    return (
      <figure>
        <div
          className={`relative overflow-hidden rounded-xl bg-muted/20 ${
            compact ? "aspect-video" : "min-h-[24rem] sm:min-h-[36rem]"
          }`}
        >
          <Image
            src={artifact.content_url}
            alt={artifact.content.slice(0, 240) || artifact.title}
            fill
            unoptimized
            sizes={compact ? "360px" : "(min-width: 1024px) 900px, 90vw"}
            className="object-contain"
          />
        </div>
        <figcaption className="mt-3 text-xs leading-5 text-muted-foreground">
          {artifact.content}
        </figcaption>
      </figure>
    )
  }
  if (artifact.format === "mermaid") {
    return (
      <MermaidDiagram
        source={artifact.content}
        title={artifact.title}
        compact={compact}
      />
    )
  }
  if (artifact.format === "code" || artifact.format === "json") {
    return (
      <CodeBlock
        code={artifact.content}
        language={
          artifact.format === "json"
            ? "json"
            : String(artifact.metadata.language ?? "text")
        }
      />
    )
  }
  return <RichContent content={artifact.content} compact={compact} />
}
