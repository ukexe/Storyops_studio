import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Gauge,
  ListTodo,
  PanelsTopLeft,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react"
import Link from "next/link"

import { ThemeToggle } from "@/components/shared/ThemeToggle"

const FEATURES = [
  {
    icon: Workflow,
    title: "One connected pipeline",
    description:
      "Keep ideas, scripts, assets, edits, feedback, publishing, and performance in one operational view.",
  },
  {
    icon: Sparkles,
    title: "Specialized AI agents",
    description:
      "Use purpose-built agents for brief clarity, script retention, brand consistency, edit pacing, and performance.",
  },
  {
    icon: ListTodo,
    title: "Recommendations that move",
    description:
      "Turn every insight into a prioritized, linked task your team can own and complete.",
  },
  {
    icon: ShieldCheck,
    title: "Human-led and secure",
    description:
      "Keep creative judgment with your team while project ownership and Supabase security protect every workspace.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "StoryOps turns a scattered review cycle into a pipeline the whole creative team can understand.",
    role: "Creative producer",
    company: "Independent studio",
  },
  {
    quote:
      "The agents focus on the operational details we normally discover after an expensive revision.",
    role: "Channel strategist",
    company: "Video-first brand",
  },
  {
    quote:
      "We keep the creative decisions. StoryOps gives us the structure and evidence to make them faster.",
    role: "Agency director",
    company: "Boutique creative team",
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              S
            </span>
            StoryOps Studio
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 font-medium hover:bg-muted md:block"
            >
              Features
            </a>
            <a
              href="#stories"
              className="hidden rounded-lg px-3 py-2 font-medium hover:bg-muted md:block"
            >
              Stories
            </a>
            <ThemeToggle />
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

      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <Bot className="size-4" />
            Built with IBM Bob · OpenAI analysis · watsonx-ready
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Run creative production as one intelligent workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Bring briefs, scripts, assets, feedback, and performance signals
            into a single command center. Specialized agents turn quality risks
            into clear recommendations and production-ready tasks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Create your workspace
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg border bg-background px-5 text-sm font-medium hover:bg-muted"
            >
              Open dashboard
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Multi-agent analysis
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Supabase security
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Human approval
            </span>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 rounded-2xl border bg-card p-3 duration-1000">
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
                    <div className="h-14 rounded-md border bg-card p-2">
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
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background p-3">
                <Gauge className="size-4 text-muted-foreground" />
                <p className="mt-3 text-2xl font-semibold">7</p>
                <p className="text-xs text-muted-foreground">Workflow stages</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <Users className="size-4 text-muted-foreground" />
                <p className="mt-3 text-2xl font-semibold">1</p>
                <p className="text-xs text-muted-foreground">
                  Shared source of truth
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              Built for real creative operations
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              AI that strengthens the process, not replaces the creator.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border bg-card p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Designed around creative teams
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A calmer way to ship better work.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.role}
                className="rounded-2xl border bg-card p-6"
              >
                <Quote className="size-5 text-muted-foreground" />
                <blockquote className="mt-5 leading-7">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-medium">{testimonial.role}</span>
                  <span className="block text-muted-foreground">
                    {testimonial.company}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Turn your next creative project into a repeatable system.
            </h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/75">
              Start with the demo, inspect the agent insights, and move one
              recommendation through your team workflow.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-background px-5 text-sm font-medium text-foreground hover:bg-background/90"
          >
            Start with StoryOps
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>StoryOps Studio · Agentic creative operations</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
