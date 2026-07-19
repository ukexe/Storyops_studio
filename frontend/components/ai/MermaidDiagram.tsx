"use client"

import { AlertCircle, Download, LoaderCircle } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { Button } from "@/components/ui/button"

function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function MermaidDiagram({
  source,
  title = "StoryOps diagram",
  compact = false,
}: {
  source: string
  title?: string
  compact?: boolean
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const isDark = useDarkMode()
  const [svg, setSvg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const { default: mermaid } = await import("mermaid")
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          htmlLabels: false,
          suppressErrorRendering: true,
          theme: isDark ? "dark" : "default",
          flowchart: { htmlLabels: false, useMaxWidth: true },
        })
        await mermaid.parse(source, { suppressErrors: false })
        const result = await mermaid.render(`storyops-${id}`, source)
        if (!cancelled) {
          setError(null)
          setSvg(result.svg)
        }
      } catch {
        if (!cancelled) {
          setSvg("")
          setError("This diagram could not be rendered safely.")
        }
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [id, isDark, source])

  function downloadSvg() {
    if (!svg) return
    saveBlob(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "storyops-diagram"}.svg`,
    )
  }

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
          <AlertCircle className="size-4" />
          Diagram unavailable
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{error}</p>
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer font-medium">View diagram source</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 font-mono">
            {source}
          </pre>
        </details>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="my-4 flex min-h-40 items-center justify-center rounded-xl border bg-muted/20 text-xs text-muted-foreground">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        Rendering diagram…
      </div>
    )
  }

  return (
    <figure className="my-5 overflow-hidden rounded-xl border bg-background">
      <div
        className={`overflow-auto p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full ${
          compact ? "max-h-80" : "max-h-[42rem]"
        }`}
        role="img"
        aria-label={title}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption className="flex items-center justify-between gap-3 border-t bg-muted/20 px-3 py-2">
        <span className="truncate text-[10px] text-muted-foreground">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={downloadSvg}
          title="Download diagram as SVG"
        >
          <Download />
          SVG
        </Button>
      </figcaption>
    </figure>
  )
}
