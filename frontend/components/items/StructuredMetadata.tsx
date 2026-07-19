import { BarChart3, Clapperboard, Database } from "lucide-react"

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return new Intl.NumberFormat().format(value)
  if (typeof value === "string") return value
  if (value == null) return "Not set"
  return "Structured value"
}

function SceneTable({ value }: { value: unknown[] }) {
  const scenes = value.filter(
    (scene): scene is Record<string, unknown> =>
      Boolean(scene) && typeof scene === "object" && !Array.isArray(scene),
  )
  if (!scenes.length) return null

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2.5 font-semibold">Scene</th>
            <th className="px-3 py-2.5 font-semibold">Start</th>
            <th className="px-3 py-2.5 font-semibold">End</th>
            <th className="px-3 py-2.5 font-semibold">Duration</th>
            <th className="px-3 py-2.5 font-semibold">Type</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene, index) => {
            const start = Number(scene.start_ms ?? 0)
            const end = Number(scene.end_ms ?? 0)
            return (
              <tr key={index} className="border-t">
                <td className="px-3 py-2.5 font-medium">{index + 1}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {(start / 1_000).toFixed(1)}s
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {(end / 1_000).toFixed(1)}s
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {(Math.max(0, end - start) / 1_000).toFixed(1)}s
                </td>
                <td className="px-3 py-2.5 capitalize text-muted-foreground">
                  {String(scene.type ?? "scene").replaceAll("_", " ")}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function StructuredMetadata({
  metadata,
}: {
  metadata: Record<string, unknown>
}) {
  const entries = Object.entries(metadata)
  const scalarEntries = entries.filter(
    ([, value]) =>
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value == null,
  )
  const scenes = Array.isArray(metadata.scenes) ? metadata.scenes : null
  const otherEntries = entries.filter(
    ([key, value]) =>
      key !== "scenes" &&
      value != null &&
      typeof value === "object" &&
      !Array.isArray(value),
  )

  return (
    <div className="space-y-4">
      {scalarEntries.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scalarEntries.map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="size-3.5" />
                <p className="text-[10px] font-semibold uppercase tracking-wider">
                  {label(key)}
                </p>
              </div>
              <p className="mt-2 break-words text-sm font-semibold">
                {displayValue(value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {scenes ? (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Clapperboard className="size-4" />
            Scene timeline
          </h3>
          <SceneTable value={scenes} />
        </section>
      ) : null}

      {otherEntries.map(([key, value]) => (
        <section key={key} className="rounded-xl border bg-muted/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Database className="size-4" />
            {label(key)}
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(value as Record<string, unknown>).map(
              ([nestedKey, nestedValue]) => (
                <div key={nestedKey}>
                  <dt className="text-xs text-muted-foreground">
                    {label(nestedKey)}
                  </dt>
                  <dd className="mt-1 break-words text-sm">
                    {Array.isArray(nestedValue)
                      ? nestedValue.map(displayValue).join(", ")
                      : displayValue(nestedValue)}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </section>
      ))}
    </div>
  )
}
