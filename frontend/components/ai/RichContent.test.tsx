import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { RichContent } from "@/components/ai/RichContent"
import { ASSET_CATEGORIES, ASSET_TEMPLATES } from "@/lib/asset-catalog"

describe("RichContent", () => {
  it("renders Markdown structure without exposing formatting syntax", () => {
    const html = renderToStaticMarkup(
      <RichContent
        content={`# Launch plan

**Ready for review**

| Asset | Status |
| --- | --- |
| Brief | Ready |

- Ship
- Measure`}
      />,
    )

    expect(html).toContain("<h1")
    expect(html).toContain("<strong>")
    expect(html).toContain("<table")
    expect(html).toContain("<li")
    expect(html).not.toContain("**Ready")
    expect(html).not.toContain("# Launch")
  })

  it("offers templates across every Asset Studio category", () => {
    for (const category of ASSET_CATEGORIES) {
      expect(
        ASSET_TEMPLATES.some((template) => template.category === category),
      ).toBe(true)
    }
    expect(ASSET_TEMPLATES.some((template) => template.format === "Image")).toBe(
      true,
    )
    expect(
      ASSET_TEMPLATES.some((template) => template.format === "Diagram"),
    ).toBe(true)
  })
})
