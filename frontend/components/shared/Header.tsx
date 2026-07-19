"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Bot, House, LogOut, Settings2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
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

        <div className="ml-auto flex items-center gap-2">
          {children}
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/">
              <House />
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
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
                <Bot />
                AI console
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
