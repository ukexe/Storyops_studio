import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getPublicEnv } from "@/lib/env"

let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabasePublishableKey } = getPublicEnv()
    browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey)
  }
  return browserClient
}
