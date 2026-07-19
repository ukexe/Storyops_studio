import type { NextConfig } from "next"

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = []

const isDevelopment = process.env.NODE_ENV === "development"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const apiUrl = process.env.NEXT_PUBLIC_API_URL
const scriptSrc =
  isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'"
const connectSources = new Set(["'self'"])
const imageSources = new Set(["'self'", "data:", "blob:"])
if (!supabaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be configured before building")
}
if (!supabasePublishableKey && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured before building",
  )
}
if (!apiUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL must be configured before building")
}
if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl)
    connectSources.add(parsedUrl.origin)
    connectSources.add(
      `${parsedUrl.protocol === "http:" ? "ws:" : "wss:"}//${parsedUrl.host}`,
    )
    imageSources.add(parsedUrl.origin)
    remotePatterns.push({
      protocol: parsedUrl.protocol === "http:" ? "http" : "https",
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: "/storage/v1/object/sign/assets/**",
    })
  } catch {
    // Runtime configuration validation reports malformed Supabase URLs.
  }
}
if (apiUrl) {
  try {
    connectSources.add(new URL(apiUrl).origin)
  } catch {
    // Runtime configuration validation reports malformed API URLs.
  }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${Array.from(imageSources).join(" ")}`,
  "font-src 'self' data:",
  `connect-src ${Array.from(connectSources).join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
if (!isDevelopment) {
  contentSecurityPolicy.push("upgrade-insecure-requests")
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy.join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ]
  },
}

export default nextConfig
