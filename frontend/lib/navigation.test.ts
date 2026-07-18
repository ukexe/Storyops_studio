import { describe, expect, it } from "vitest"

import { safeInternalPath } from "./navigation"

describe("safeInternalPath", () => {
  it("preserves valid application deep links", () => {
    expect(safeInternalPath("/projects/123/items/456?tab=analysis")).toBe(
      "/projects/123/items/456?tab=analysis",
    )
  })

  it("rejects protocol-relative and backslash external redirects", () => {
    expect(safeInternalPath("//evil.example")).toBe("/dashboard")
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard")
    expect(safeInternalPath("https://evil.example/path")).toBe("/dashboard")
  })

  it("uses the fallback for missing or malformed input", () => {
    expect(safeInternalPath(null, "/login")).toBe("/login")
    expect(safeInternalPath("not-a-path", "/login")).toBe("/login")
  })
})
