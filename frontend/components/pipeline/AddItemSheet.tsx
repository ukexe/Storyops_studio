"use client"

import { useState, type FormEvent } from "react"
import { AlertCircle, Upload } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { createItem } from "@/lib/api"
import {
  ITEM_TYPES,
  type Item,
  type ItemType,
  type PipelineStage,
} from "@/types"

const MAX_FILE_BYTES = 10 * 1024 * 1024

function defaultTypeForStage(stage: PipelineStage): ItemType {
  const defaults: Record<PipelineStage, ItemType> = {
    Idea: "brief",
    Script: "script",
    Assets: "asset",
    Edit: "edit",
    Feedback: "feedback",
    Publish: "script",
    Analyze: "metric",
  }
  return defaults[stage]
}

interface AddItemSheetProps {
  projectId: string
  stage: PipelineStage
  onClose: () => void
  onCreated: (item: Item) => void
}

export function AddItemSheet({
  projectId,
  stage,
  onClose,
  onCreated,
}: AddItemSheetProps) {
  const [type, setType] = useState<ItemType>(() => defaultTypeForStage(stage))
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (type === "asset") {
      if (!file) {
        setError("Choose an image file for this asset.")
        return
      }
      if (!file.type.startsWith("image/")) {
        setError("Asset files must be images.")
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Asset images must be 10 MB or smaller.")
        return
      }
    } else if (!content.trim()) {
      setError("Add content or notes for this item.")
      return
    }

    let metadata: Record<string, unknown> =
      type === "script" ? { content_type: "youtube" } : {}
    if (type === "edit" || type === "metric") {
      try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Metadata must be a JSON object.")
        }
        metadata = parsed as Record<string, unknown>
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Metadata must be valid JSON.",
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const item = await createItem(projectId, {
        stage,
        type,
        title: title.trim(),
        content:
          type === "asset" || type === "edit" || type === "metric"
            ? null
            : content.trim(),
        metadata,
        file,
      })
      onCreated(item)
      toast.success("Item added", {
        description: `${item.title} is now in ${item.stage}.`,
      })
      onClose()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create item.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose()
        }
      }}
    >
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Add item to {stage}</SheetTitle>
            <SheetDescription>
              Capture the creative work now. AI analysis can be run from the
              item detail page.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 px-4 py-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={500}
                placeholder="Give this item a clear name"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as ItemType)
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="item-type" className="w-full">
                  <SelectValue placeholder="Select an item type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((itemType) => (
                    <SelectItem
                      key={itemType}
                      value={itemType}
                      className="capitalize"
                    >
                      {itemType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === "asset" ? (
              <div className="space-y-2">
                <Label htmlFor="item-file">Image asset</Label>
                <label
                  htmlFor="item-file"
                  className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-5 text-center hover:bg-muted/40"
                >
                  <Upload className="mb-2 size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {file ? file.name : "Choose an image"}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    PNG, JPEG, GIF, or WebP up to 10 MB
                  </span>
                </label>
                <Input
                  id="item-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    setFile(event.target.files?.item(0) ?? null)
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="item-content">
                  {type === "edit" || type === "metric"
                    ? "Metadata JSON"
                    : "Content"}
                </Label>
                <Textarea
                  id="item-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={
                    type === "edit"
                      ? '{"scenes":[{"start_ms":0,"end_ms":4500,"type":"talking_head"}]}'
                      : type === "metric"
                        ? '{"views":1000,"avg_retention_pct":52,"ctr_pct":5.4}'
                        : "Paste the brief, script, or notes here"
                  }
                  rows={12}
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          <SheetFooter className="border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? "Adding…" : "Add item"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
