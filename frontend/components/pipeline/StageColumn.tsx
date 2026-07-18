"use client"

import { Plus } from "lucide-react"

import { ItemCard } from "@/components/pipeline/ItemCard"
import { Button } from "@/components/ui/button"
import type { Item, PipelineStage } from "@/types"

interface StageColumnProps {
  stage: PipelineStage
  items: Item[]
  onAddItem: () => void
}

export function StageColumn({
  stage,
  items,
  onAddItem,
}: StageColumnProps) {
  return (
    <section
      className="flex w-[290px] shrink-0 flex-col rounded-xl border bg-muted/25"
      aria-labelledby={`stage-${stage}`}
    >
      <header className="flex items-center justify-between border-b px-3 py-3">
        <h2 id={`stage-${stage}`} className="text-sm font-semibold">
          {stage}
        </h2>
        <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </header>

      <div className="flex min-h-40 flex-1 flex-col gap-2 p-2">
        {items.length > 0 ? (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        ) : (
          <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-background/40 px-4 text-center text-xs text-muted-foreground">
            No items in {stage.toLowerCase()}.
          </div>
        )}
      </div>

      <div className="border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onAddItem}
        >
          <Plus />
          Add item
        </Button>
      </div>
    </section>
  )
}
