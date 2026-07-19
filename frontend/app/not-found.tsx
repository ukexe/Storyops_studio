import { ArrowLeft, FileQuestion } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-xl shadow-primary/5">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="size-5" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          This workspace view was not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The link may be outdated, or the resource may no longer belong to this
          project.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            <ArrowLeft />
            Return to projects
          </Link>
        </Button>
      </div>
    </main>
  )
}
