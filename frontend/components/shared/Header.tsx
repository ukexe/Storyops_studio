"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  History,
  House,
  Layers3,
  ListTodo,
  LogOut,
  Menu,
  Palette,
  Settings2,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { createClient } from "@/utils/supabase/client"

interface HeaderProps {
  context?: ReactNode
  children?: ReactNode
}

export function Header({ context, children }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const projectId = /^\/projects\/([^/]+)/.exec(pathname)?.[1]

  useEffect(() => {
    let isMounted = true
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (isMounted) {
          setEmail(data.user?.email ?? null)
        }
      })
      .catch(() => {
        if (isMounted) {
          setEmail(null)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      router.replace("/login")
      router.refresh()
    } catch (caught) {
      toast.error("Unable to sign out", {
        description:
          caught instanceof Error ? caught.message : "Please try again.",
      })
      setIsSigningOut(false)
    }
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2"
          aria-label="StoryOps Studio dashboard"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            S
          </span>
          <span className="hidden font-semibold sm:inline">StoryOps Studio</span>
        </Link>

        {context ? (
          <div className="min-w-0 border-l pl-4 text-sm text-muted-foreground">
            {context}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {children ? <div className="hidden md:block">{children}</div> : null}
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
            <Link href="/">
              <House />
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          {projectId ? (
            <Button
              asChild
              variant={pathname.endsWith("/console") ? "secondary" : "ghost"}
              size="sm"
              className="hidden xl:flex"
            >
              <Link href={`/projects/${projectId}/console`}>
                <Palette />
                AI Asset Studio
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
            <Link href="/settings">
              <Settings2 />
              Settings
            </Link>
          </Button>
          <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:inline">
            {email}
          </span>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,22rem)]">
              <SheetHeader>
                <SheetTitle>StoryOps Studio</SheetTitle>
                <SheetDescription>
                  Project navigation and workspace settings.
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2 px-4" aria-label="Mobile navigation">
                <MobileLink
                  href="/"
                  icon={House}
                  onSelect={() => setIsMenuOpen(false)}
                >
                  Home
                </MobileLink>
                <MobileLink
                  href="/dashboard"
                  icon={Layers3}
                  onSelect={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </MobileLink>
                {projectId ? (
                  <>
                    <MobileLink
                      href={`/projects/${projectId}`}
                      icon={Layers3}
                      onSelect={() => setIsMenuOpen(false)}
                    >
                      Pipeline
                    </MobileLink>
                    <MobileLink
                      href={`/projects/${projectId}/console`}
                      icon={Palette}
                      onSelect={() => setIsMenuOpen(false)}
                    >
                      AI Asset Studio
                    </MobileLink>
                    <MobileLink
                      href={`/projects/${projectId}/tasks`}
                      icon={ListTodo}
                      onSelect={() => setIsMenuOpen(false)}
                    >
                      Tasks
                    </MobileLink>
                    <MobileLink
                      href={`/projects/${projectId}/timeline`}
                      icon={History}
                      onSelect={() => setIsMenuOpen(false)}
                    >
                      Timeline
                    </MobileLink>
                  </>
                ) : null}
                <MobileLink
                  href="/settings"
                  icon={Settings2}
                  onSelect={() => setIsMenuOpen(false)}
                >
                  Settings
                </MobileLink>
              </nav>
              {email ? (
                <p className="mt-auto truncate border-t px-4 py-4 text-xs text-muted-foreground">
                  Signed in as {email}
                </p>
              ) : null}
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}

function MobileLink({
  href,
  icon: Icon,
  onSelect,
  children,
}: {
  href: string
  icon: typeof House
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <Button asChild variant="ghost" className="justify-start">
      <Link href={href} onClick={onSelect}>
        <Icon />
        {children}
      </Link>
    </Button>
  )
}
