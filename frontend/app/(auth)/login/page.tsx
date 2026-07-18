"use client"

import { useState, type FormEvent } from "react"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { safeInternalPath } from "@/lib/navigation"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) {
        setError(signInError.message)
        return
      }
      const requestedNext = new URLSearchParams(window.location.search).get("next")
      router.replace(safeInternalPath(requestedNext))
      router.refresh()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to sign in. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage your creative production pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New to StoryOps?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
