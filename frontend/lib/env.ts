export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (!supabaseUrl || !supabasePublishableKey || !apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and NEXT_PUBLIC_API_URL must be configured",
    )
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    supabasePublishableKey,
    apiUrl: apiUrl.replace(/\/+$/, ""),
  }
}
