import { FileImage, FileText, MessageSquareText, Video } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Item, ItemType } from "@/types"

const TYPE_ICONS: Record<ItemType, typeof FileText> = {
  brief: FileText,
  script: FileText,
  asset: FileImage,
  edit: Video,
  feedback: MessageSquareText,
  metric: FileText,
}

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const TypeIcon = TYPE_ICONS[item.type]
  const isAnalyzed = item.latest_analysis !== null

  return (
    <Link
      href={`/projects/${item.project_id}/items/${item.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="gap-3 py-4 transition-colors hover:border-foreground/25 hover:bg-muted/20">
        <CardHeader className="px-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-sm leading-5">
              {item.title}
            </CardTitle>
            <span
              className={`mt-1 size-2 shrink-0 rounded-full ${
                isAnalyzed ? "bg-emerald-500" : "bg-muted-foreground/35"
              }`}
              role="img"
              aria-label={isAnalyzed ? "Analysis complete" : "Not analyzed"}
              title={isAnalyzed ? "Analysis complete" : "Not analyzed"}
            />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between px-4">
          <Badge variant="secondary" className="gap-1 font-normal capitalize">
            <TypeIcon className="size-3" />
            {item.type}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, {
              month: "short",
              day: "numeric",
            }).format(new Date(item.updated_at))}
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
