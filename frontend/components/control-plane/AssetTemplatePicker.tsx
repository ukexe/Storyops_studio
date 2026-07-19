"use client"

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Code2,
  FileText,
  Megaphone,
  Palette,
  PanelsTopLeft,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ASSET_CATEGORIES,
  ASSET_TEMPLATES,
  type AssetCategory,
  type AssetTemplate,
} from "@/lib/asset-catalog"

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  Documentation: FileText,
  Visual: Palette,
  Architecture: Building2,
  Engineering: Code2,
  Product: PanelsTopLeft,
  Business: BriefcaseBusiness,
  Marketing: Megaphone,
  Analytics: BarChart3,
}

export function AssetTemplatePicker({
  onSelect,
  compact = false,
}: {
  onSelect: (template: AssetTemplate) => void
  compact?: boolean
}) {
  const [category, setCategory] = useState<AssetCategory>("Documentation")
  const templates = useMemo(
    () => ASSET_TEMPLATES.filter((template) => template.category === category),
    [category],
  )

  return (
    <div>
      <div
        className={`flex gap-1.5 overflow-x-auto pb-2 ${
          compact ? "flex-col overflow-visible" : ""
        }`}
        role="group"
        aria-label="Asset categories"
      >
        {ASSET_CATEGORIES.map((value) => {
          const Icon = CATEGORY_ICONS[value]
          return (
            <Button
              key={value}
              type="button"
              aria-pressed={category === value}
              variant={category === value ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setCategory(value)}
              className={compact ? "w-full justify-start" : "shrink-0"}
            >
              <Icon />
              {value}
            </Button>
          )
        })}
      </div>

      <div
        className={
          compact
            ? "mt-3 space-y-1.5"
            : "mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`group rounded-xl border bg-background text-left transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              compact ? "w-full p-2.5" : "p-3"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold">{template.title}</span>
              {!compact ? (
                <Badge variant="outline" className="text-[9px]">
                  {template.format}
                </Badge>
              ) : null}
            </div>
            {!compact ? (
              <span className="mt-1.5 block text-[11px] leading-5 text-muted-foreground">
                {template.description}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
