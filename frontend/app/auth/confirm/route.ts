import type { EmailOtpType } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { safeInternalPath } from "@/lib/navigation"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const code = url.searchParams.get("code")
  const next = safeInternalPath(url.searchParams.get("next"))
  const supabase = createClient(await cookies())

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin))
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", url.origin))
}
