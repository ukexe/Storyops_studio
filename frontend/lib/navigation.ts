const SAFE_BASE_URL = "https://storyops.local"

export function safeInternalPath(
  requestedPath: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!requestedPath || !requestedPath.startsWith("/")) {
    return fallback
  }

  try {
    const resolved = new URL(requestedPath, SAFE_BASE_URL)
    if (resolved.origin !== SAFE_BASE_URL) {
      return fallback
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return fallback
  }
}
