import type { Metadata } from "next"

import { IPFoundryExperience } from "@/components/marketing/IPFoundryExperience"

export const metadata: Metadata = {
  title: "IP Foundry V2 · Enterprise Creative Intelligence",
  description:
    "Explore StoryOps Studio's evolution into an explainable, multi-agent operating system for reusable IP discovery, governed generation, and measurable business impact.",
}

export default function Home() {
  return <IPFoundryExperience />
}
