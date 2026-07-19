import { afterEach, describe, expect, it, vi } from "vitest"

import {
  deterministicGeneration,
  openAIImageGeneration,
  planCommand,
} from "./control-plane"
import {
  openAIAnalysis,
  parseItemInput,
  rulesAnalysis,
  type WorkerEnv,
} from "./index"

const env: WorkerEnv = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "test-secret",
  CORS_ORIGINS: "https://storyops.example",
  OPENAI_API_KEY: "test-openai-key",
  OPENAI_MODEL: "gpt-5.6-luna",
  OPENAI_IMAGE_MODEL: "gpt-image-1.5",
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

  it("rejects hidden file uploads on non-asset items", async () => {
    const form = new FormData()
    form.set("stage", "Script")
    form.set("type", "script")
    form.set("title", "Script with stale file")
    form.set("content", "A valid script body.")
    form.set(
      "file",
      new File([new Uint8Array([0xff, 0xd8, 0xff])], "stale.jpg", {
        type: "image/jpeg",
      }),
    )

    await expect(
      parseItemInput(
        new Request("https://storyops.example/api/v1/projects/id/items", {
          method: "POST",
          body: form,
        }),
      ),
    ).rejects.toThrow("File uploads are only supported for asset items")
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

  it("sends trusted image bytes as a high-detail vision input", async () => {
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
      detail: "high",
    })
    expect(body.input[0].content[1].image_url).toMatch(
      /^data:image\/jpeg;base64,/,
    )
  })
})

describe("StoryOps intelligence control plane", () => {
  it("routes report requests to the impact specialist and artifact writer", () => {
    const plan = planCommand(
      "Generate an executive impact report.",
      "00000000-0000-0000-0000-000000000001",
    )

    expect(plan.intent).toBe("executive_report")
    expect(plan.agentType).toBe("impact_analyst")
    expect(plan.tools).toContain("artifact_writer")
    expect(plan.artifactType).toBe("executive_report")
  })

  it("produces an audited, evidence-bounded deterministic fallback", () => {
    const plan = planCommand(
      "Analyze my uploaded documents.",
      "00000000-0000-0000-0000-000000000001",
    )
    const result = deterministicGeneration("Analyze my uploaded documents.", plan, {
      project: { name: "Pattern Library" },
      metrics: {
        total_items: 2,
        analyzed_items: 1,
        total_analysis_records: 1,
        task_status_counts: { todo: 1, in_progress: 0, done: 0 },
      },
      items: [
        { title: "Analyzed brief", analysis: { summary: "Ready" } },
        { title: "Unreviewed script", analysis: null },
      ],
      tasks: [
        {
          title: "Resolve evidence gap",
          priority: "high",
          status: "todo",
        },
      ],
    })

    expect(result.modelId).toBe("storyops/control-plane-rules-v2")
    expect(result.response).toContain("2 items")
    expect(result.recommendedActions[0]).toContain("Unreviewed script")
  })

  it("routes visual requests through private image generation", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_visual",
          output: [
            {
              id: "ig_123",
              type: "image_generation_call",
              status: "completed",
              revised_prompt:
                "An original launch graphic with a clear editorial focal point.",
              result: "/9j/AA==",
            },
          ],
          usage: { total_tokens: 120 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", request)
    const plan = planCommand(
      "Generate a launch campaign graphic.",
      "00000000-0000-4000-8000-000000000001",
    )

    expect(plan.intent).toBe("visual_asset")
    expect(plan.artifactFormat).toBe("image")

    const result = await openAIImageGeneration(
      env,
      "Generate a launch campaign graphic.",
      plan,
      {
        project: { name: "Launch campaign" },
        metrics: { total_items: 4 },
      },
    )

    expect(result.modelId).toBe("openai/gpt-image-1.5")
    expect(result.binaryArtifact?.mimeType).toBe("image/jpeg")
    expect(result.artifactFormat).toBe("image")
    const [, options] = request.mock.calls[0]
    const body = JSON.parse(String(options.body))
    expect(body.store).toBe(false)
    expect(body.tools[0]).toMatchObject({
      type: "image_generation",
      model: "gpt-image-1.5",
      output_format: "jpeg",
    })
  })
})
