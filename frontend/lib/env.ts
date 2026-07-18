export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1"

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured",
    )
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    supabasePublishableKey,
    apiUrl: apiUrl.replace(/\/+$/, ""),
  }
}
