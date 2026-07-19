"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <main className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-xl shadow-primary/5">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            StoryOps needs a fresh start
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            An unexpected application error interrupted this view. Your persisted
            project data and completed AI runs are unchanged.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
