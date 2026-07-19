import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Asset Studio",
  description:
    "Generate project-aware documents, diagrams, code, analytics, and original visual assets.",
}

export default function AssetStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
