import { describe, expect, it } from "vitest"

import { rulesAnalysis } from "./index"

describe("edge analysis rules", () => {
  it("turns missing brief details into linked task drafts", () => {
    const result = rulesAnalysis({
      type: "brief",
      content: "Create a short YouTube launch video for agency producers.",
      metadata: {},
    })

    expect(result.agent_type).toBe("brief")
    expect(result.score_metrics.clarity_score).toBeLessThan(9)
    expect(result.tasks.some((task) => task.title.includes("Call to action"))).toBe(
      true,
    )
  })

  it("detects a script hook and call to action", () => {
    const result = rulesAnalysis({
      type: "script",
      content:
        "What if your creative team shipped twice as fast? Follow us for the next workflow.",
      metadata: { content_type: "youtube" },
    })

    expect(result.score_metrics.hook_strength).toBe(7)
    expect(result.score_metrics.cta_present).toBe(true)
    expect(result.tasks).toHaveLength(0)
  })

  it("flags long edit scenes", () => {
    const result = rulesAnalysis({
      type: "edit",
      content: null,
      metadata: { scenes: [{ start_ms: 0, end_ms: 12_000 }] },
    })

    expect(result.score_metrics.longest_scene_seconds).toBe(12)
    expect(result.tasks[0]?.priority).toBe("high")
  })
})
