import { afterEach, describe, expect, it, vi } from "vitest"

import { openAIAnalysis, rulesAnalysis, type WorkerEnv } from "./index"

const env: WorkerEnv = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  CORS_ORIGINS: "https://storyops.example",
  OPENAI_API_KEY: "test-openai-key",
  OPENAI_MODEL: "gpt-5.6-luna",
}

afterEach(() => {
  vi.unstubAllGlobals()
})

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

describe("OpenAI analysis provider", () => {
  it("uses structured output and records the real provider model", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            summary: "The opening establishes a clear audience promise.",
            recommendations: [
              {
                title: "Tighten the CTA",
                detail: "End with one specific next step.",
                priority: "medium",
              },
            ],
            metrics: [
              { key: "hook_strength", value: "8" },
              { key: "cta_present", value: "false" },
            ],
          }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", request)

    const result = await openAIAnalysis(env, {
      type: "script",
      title: "Launch Script",
      content: "What if your creative team could move twice as fast?",
      metadata: { content_type: "youtube" },
    })

    expect(result.model_id).toBe("openai/gpt-5.6-luna")
    expect(result.score_metrics.hook_strength).toBe(8)
    expect(result.score_metrics.cta_present).toBe(false)
    expect(result.tasks).toHaveLength(1)

    const [, options] = request.mock.calls[0]
    const body = JSON.parse(String(options.body))
    expect(body.store).toBe(false)
    expect(body.text.format.type).toBe("json_schema")
  })

  it("sends trusted image bytes as a low-detail vision input", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            summary: "The thumbnail has clear contrast.",
            recommendations: [],
            metrics: [{ key: "brand_consistency", value: "9" }],
          }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", request)

    await openAIAnalysis(
      env,
      { type: "asset", title: "Thumbnail", metadata: {} },
      { bytes: new Uint8Array([0xff, 0xd8, 0xff]), mime: "image/jpeg" },
    )

    const [, options] = request.mock.calls[0]
    const body = JSON.parse(String(options.body))
    expect(body.input[0].content[1]).toMatchObject({
      type: "input_image",
      detail: "low",
    })
    expect(body.input[0].content[1].image_url).toMatch(
      /^data:image\/jpeg;base64,/,
    )
  })
})
