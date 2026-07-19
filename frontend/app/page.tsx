import type { Metadata } from "next"

import { StoryOpsExperience } from "@/components/marketing/StoryOpsExperience"

export const metadata: Metadata = {
  title: "AI Creative Operations & Asset Studio",
  description:
    "Plan, analyze, and create production-ready project assets with StoryOps Studio's explainable creative pipeline, specialist AI, tasks, and timeline.",
}

export default function Home() {
  return <StoryOpsExperience />
}
