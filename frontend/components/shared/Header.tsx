"use client"

import { useEffect, useState, type ReactNode } from "react"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  context?: ReactNode
  children?: ReactNode
}

export function Header({ context, children }: HeaderProps) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    await createClient().auth.signOut()
    router.replace("/login")
    router.refresh()
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Dashboard</Link>
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
