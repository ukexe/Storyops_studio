import type { NextConfig } from "next"

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = []

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be configured before building")
}
if (supabaseUrl) {
  try {
    const parsedUrl = new URL(supabaseUrl)
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

const nextConfig: NextConfig = {
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://storyops-api.ukexe06.workers.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
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
