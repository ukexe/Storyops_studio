import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage StoryOps Studio creative projects and demo workspaces.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
