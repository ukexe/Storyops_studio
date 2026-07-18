import { ArrowRight, Bot, PanelsTopLeft, Workflow } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              S
            </span>
            StoryOps Studio
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 font-medium hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/80"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <Bot className="size-4" />
            Powered by IBM Granite and watsonx.ai
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Run creative production as one intelligent workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Bring briefs, scripts, assets, feedback, and performance signals
            into a single pipeline. Specialized AI agents turn gaps and quality
            risks into clear recommendations and tasks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Create your workspace
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-3">
          <div className="rounded-xl border bg-muted/30 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Explained Series</p>
                <p className="text-xs text-muted-foreground">
                  Creative pipeline
                </p>
              </div>
              <Workflow className="size-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Idea", "Script", "Assets"].map((stage, index) => (
                <div key={stage} className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium">{stage}</p>
                  <div className="mt-3 space-y-2">
                    <div className="h-12 rounded-md border bg-card p-2">
                      <div className="h-1.5 w-3/4 rounded bg-foreground/15" />
                      <div className="mt-2 h-1.5 w-1/2 rounded bg-foreground/10" />
                    </div>
                    {index > 0 ? (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Agent reviewed
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
              <PanelsTopLeft className="size-4" />
              Three actionable tasks generated from pipeline analysis
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
