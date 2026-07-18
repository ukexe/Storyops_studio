"use client"

import { StageColumn } from "@/components/pipeline/StageColumn"
import {
  PIPELINE_STAGES,
  type ItemsByStage,
  type PipelineStage,
} from "@/types"

interface PipelineBoardProps {
  itemsByStage: ItemsByStage
  onAddItem: (stage: PipelineStage) => void
}

export function PipelineBoard({
  itemsByStage,
  onAddItem,
}: PipelineBoardProps) {
  return (
    <div
      className="overflow-x-auto pb-4"
      role="region"
      aria-label="Creative production pipeline"
      tabIndex={0}
    >
      <div className="flex min-w-max gap-3">
        {PIPELINE_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            items={itemsByStage[stage] ?? []}
            onAddItem={() => onAddItem(stage)}
          />
        ))}
      </div>
    </div>
  )
}
