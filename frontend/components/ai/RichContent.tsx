"use client"

import { AlertCircle, Check, Copy, Download, LoaderCircle } from "lucide-react"
import {
  isValidElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import { Highlight, themes, type Language } from "prism-react-renderer"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"

const LANGUAGE_ALIASES: Record<string, Language> = {
  bash: "bash",
  css: "css",
  html: "markup",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  python: "python",
  py: "python",
  shell: "bash",
  sql: "sql",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  xml: "markup",
  yaml: "yaml",
  yml: "yaml",
}

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

function normalizeLanguage(value?: string): Language {
  if (!value) return "markup"
  return LANGUAGE_ALIASES[value.toLowerCase()] ?? "markup"
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CodeBlock({
  code,
  language,
}: {
  code: string
  language?: string
}) {
  const isDark = useDarkMode()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="my-5 overflow-hidden rounded-xl border bg-slate-950 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          {language || "text"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void copy()}
          className="text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Highlight
        theme={isDark ? themes.vsDark : themes.nightOwl}
        code={code}
        language={normalizeLanguage(language)}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} max-h-[32rem] overflow-auto p-4 text-xs leading-6`}
            style={{ ...style, margin: 0, background: "transparent" }}
          >
            {tokens.map((line, index) => (
              <div key={index} {...getLineProps({ line })}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
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

function RichPre({ children }: { children?: ReactNode }) {
  const child = isValidElement(children)
    ? (children as ReactElement<{ className?: string; children?: ReactNode }>)
    : null
  const className = child?.props.className ?? ""
  const language = /language-([\w-]+)/.exec(className)?.[1]
  const code = String(child?.props.children ?? children ?? "").replace(/\n$/, "")

  if (language === "mermaid") {
    return <MermaidDiagram source={code} />
  }
  return <CodeBlock code={code} language={language} />
}

export function RichContent({
  content,
  compact = false,
  className = "",
}: {
  content: string
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`min-w-0 break-words text-sm leading-7 text-foreground ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        urlTransform={(url) => defaultUrlTransform(url)}
        components={{
          h1: ({ children }) => (
            <h1
              className={
                compact
                  ? "mb-2 mt-4 text-base font-semibold"
                  : "mb-3 mt-7 text-2xl font-semibold tracking-tight"
              }
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={
                compact
                  ? "mb-2 mt-4 text-sm font-semibold"
                  : "mb-3 mt-7 text-xl font-semibold tracking-tight"
              }
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 text-base font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="my-3 whitespace-normal text-pretty text-muted-foreground">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1.5 pl-5 text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-xl border-l-4 border-primary bg-primary/5 px-4 py-2 text-sm">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b px-3 py-2.5 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b px-3 py-2.5 align-top text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-border" />,
          pre: RichPre,
          code: ({ children, className: codeClassName }) => (
            <code
              className={`rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground ${codeClassName ?? ""}`}
            >
              {children}
            </code>
          ),
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // Generated Markdown may contain safe, CSP-governed image references.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || "Generated project visual"}
                loading="lazy"
                className="my-5 h-auto max-w-full rounded-xl border bg-muted/20"
              />
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
