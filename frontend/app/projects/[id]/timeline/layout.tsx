import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workspace Timeline",
  description:
    "Inspect StoryOps workflow provenance, model audits, correlation, and replay lineage.",
}

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
