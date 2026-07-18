import Link from "next/link"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-4 py-12">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            S
          </span>
          StoryOps Studio
        </Link>
        {children}
      </div>
    </main>
  )
}
