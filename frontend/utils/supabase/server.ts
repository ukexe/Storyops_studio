import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getPublicEnv } from "@/lib/env"

export function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv()

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Proxy refreshes cookies when Server Components cannot write them.
        }
      },
    },
  })
}
