"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TagFilterSearch } from "@/components/tag-filter-search"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  clampExportLimit,
  DEFAULT_EXPORT_LIMIT,
  EXPORT_LIMIT_STEP,
  EXPORT_PREVIEW_ROWS,
  MAX_EXPORT_LIMIT,
  MIN_EXPORT_LIMIT,
  type ExportFilters,
  type ExportPreview,
  type ExportPreviewLead,
} from "@/types/export"
import type { Tag } from "@/types/tag"
import { tagTitlesForIds } from "@/lib/export-csv"

import { createExport, previewExport } from "./export.action"
import { computeExportPreview } from "./export-query"

const countFormat = new Intl.NumberFormat("en-IN")

function formatCount(value: number) {
  return countFormat.format(value)
}

function downloadExport(id: string, fileName: string) {
  const link = document.createElement("a")
  link.href = `/export/${id}/download`
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
}

function selectionKey(filters: Pick<ExportFilters, "source" | "location" | "tags" | "includePreviouslyExported">) {
  return `${filters.source ?? ""}:${filters.location ?? ""}:${filters.tags.slice().sort((a, b) => a - b).join(",")}:${filters.includePreviouslyExported}`
}

export function ExportForm({
  sources,
  locations,
  tags,
  initialFilters,
  initialPreview,
  initialSamples,
}: {
  sources: string[]
  locations: string[]
  tags: Tag[]
  initialFilters: ExportFilters
  initialPreview: ExportPreview
  initialSamples: ExportPreviewLead[]
}) {
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)
  const [counts, setCounts] = useState({
    matching: initialPreview.matching,
    neverExported: initialPreview.neverExported,
  })
  const [samples, setSamples] = useState(initialSamples)
  const [limitDraft, setLimitDraft] = useState(String(initialFilters.limit))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPreviewing, startPreview] = useTransition()
  const [isExporting, startExport] = useTransition()
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const preview = computeExportPreview(counts.matching, counts.neverExported, filters)
  const initialSelection = selectionKey(initialFilters)
  const currentSelection = selectionKey(filters)
  const initialCountsKey = `${initialPreview.matching}:${initialPreview.neverExported}`

  useEffect(() => {
    setLimitDraft(String(filters.limit))
  }, [filters.limit])

  useEffect(() => {
    if (currentSelection === initialSelection) {
      setCounts({
        matching: initialPreview.matching,
        neverExported: initialPreview.neverExported,
      })
      setSamples(initialSamples)
      return
    }

    let cancelled = false
    startPreview(async () => {
      const result = await previewExport(filtersRef.current)
      if (cancelled) return
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCounts({
        matching: result.preview.matching,
        neverExported: result.preview.neverExported,
      })
      setSamples(result.samples)
    })

    return () => {
      cancelled = true
    }
  }, [currentSelection, initialSelection, initialCountsKey, initialPreview, initialSamples])

  function patch(next: Partial<ExportFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  function commitLimit(raw: string) {
    const parsed = Number.parseInt(raw.replaceAll(",", "").trim(), 10)
    if (!Number.isFinite(parsed)) {
      setLimitDraft(String(filters.limit))
      return
    }
    const next = clampExportLimit(parsed)
    patch({ limit: next })
    setLimitDraft(String(next))
  }

  function runExport() {
    startExport(async () => {
      const result = await createExport(filters)
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      downloadExport(result.id, result.fileName)
      toast.success(
        result.previouslyExportedCount > 0
          ? `Exported ${formatCount(result.leadCount)} numbers, including ${formatCount(result.previouslyExportedCount)} previously exported.`
          : `Exported ${formatCount(result.leadCount)} new numbers.`,
      )
      setConfirmOpen(false)
      const nextPreview = await previewExport(filters)
      if (nextPreview.ok) {
        setCounts({
          matching: nextPreview.preview.matching,
          neverExported: nextPreview.preview.neverExported,
        })
        setSamples(nextPreview.samples)
      }
      router.refresh()
    })
  }

  function onExportClick() {
    if (preview.batchSize === 0) return
    if (preview.previouslyExportedInBatch > 0) {
      setConfirmOpen(true)
      return
    }
    runExport()
  }

  const canExport = preview.batchSize > 0 && !isExporting
  const filterHint = [
    filters.location,
    filters.source,
    ...tagTitlesForIds(filters.tags, tags),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New batch</CardTitle>
        <CardDescription>
          Pick a batch size up to {formatCount(DEFAULT_EXPORT_LIMIT)}. New
          contacts go first. Already-exported numbers stay out unless you turn
          on Export again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Location</FieldLabel>
            <Select
              value={filters.location ?? "all"}
              onValueChange={(value) =>
                patch({
                  location: value === "all" ? undefined : String(value),
                })
              }
              disabled={isExporting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Source</FieldLabel>
            <Select
              value={filters.source ?? "all"}
              onValueChange={(value) =>
                patch({
                  source: value === "all" ? undefined : String(value),
                })
              }
              disabled={isExporting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="export-tags">Tags</FieldLabel>
            <TagFilterSearch
              id="export-tags"
              tags={tags}
              selected={filters.tags}
              onChange={(next) => patch({ tags: next })}
              disabled={isExporting}
            />
          </Field>

          <Field className="sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="export-limit">Batch size</FieldLabel>
              <Input
                id="export-limit"
                type="number"
                min={MIN_EXPORT_LIMIT}
                max={MAX_EXPORT_LIMIT}
                step={EXPORT_LIMIT_STEP}
                inputMode="numeric"
                value={limitDraft}
                disabled={isExporting}
                onChange={(event) => setLimitDraft(event.target.value)}
                onBlur={() => commitLimit(limitDraft)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur()
                  }
                }}
                className="w-24 text-right tabular-nums"
              />
            </div>
            <Slider
              min={MIN_EXPORT_LIMIT}
              max={MAX_EXPORT_LIMIT}
              step={EXPORT_LIMIT_STEP}
              value={[filters.limit]}
              onValueChange={(value) => {
                const raw = Array.isArray(value) ? value[0] : value
                const next = clampExportLimit(raw ?? filters.limit)
                patch({ limit: next })
              }}
              disabled={isExporting}
              aria-label="Batch size"
            />
            <FieldDescription>
              {formatCount(MIN_EXPORT_LIMIT)} to {formatCount(MAX_EXPORT_LIMIT)},
              in steps of {formatCount(EXPORT_LIMIT_STEP)}.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>File format</FieldLabel>
            <Select
              value={filters.format}
              onValueChange={(value) =>
                patch({
                  format: value === "numbers" ? "numbers" : "csv",
                })
              }
              disabled={isExporting}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="csv">CSV with name and location</SelectItem>
                <SelectItem value="numbers">Numbers only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="export-again">Export again</FieldLabel>
            <FieldDescription>
              Include numbers from earlier batches, starting with those exported
              least recently so the same numbers are not back-to-back.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="export-again"
            checked={filters.includePreviouslyExported}
            onCheckedChange={(checked) =>
              patch({ includePreviouslyExported: checked })
            }
            disabled={isExporting}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PreviewStat
            label={filterHint ? `Matching · ${filterHint}` : "Matching"}
            value={formatCount(preview.matching)}
            pending={isPreviewing}
          />
          <PreviewStat
            label="Never exported"
            value={formatCount(preview.neverExported)}
            pending={isPreviewing}
          />
          <PreviewStat
            label="This batch"
            value={formatCount(preview.batchSize)}
            pending={isPreviewing}
            hint={
              preview.previouslyExportedInBatch > 0
                ? `${formatCount(preview.newInBatch)} new · ${formatCount(preview.previouslyExportedInBatch)} again`
                : preview.batchSize > 0
                  ? "All new"
                  : undefined
            }
          />
          <PreviewStat
            label="Still unexported"
            value={formatCount(preview.remainingNeverExported)}
            pending={isPreviewing}
          />
        </div>

        <div className={isPreviewing ? "opacity-50" : undefined}>
          {samples.length > 0 ? (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium">Preview</p>
                <p className="text-xs text-muted-foreground">
                  First {formatCount(samples.length)} of{" "}
                  {formatCount(preview.batchSize)} in this file
                  {preview.batchSize > EXPORT_PREVIEW_ROWS
                    ? ` · ${formatCount(preview.batchSize - samples.length)} more in the download`
                    : ""}
                </p>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samples.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.mobile}</TableCell>
                        <TableCell>{lead.location ?? "—"}</TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell className="max-w-28 truncate font-mono text-[11px] text-muted-foreground">
                          {lead.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-sm font-medium">No preview</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Numbers that would go in this file will show up here.
              </p>
            </div>
          )}
        </div>

        {preview.batchSize === 0 ? (
          <Alert>
            <AlertTitle>Nothing to export</AlertTitle>
            <AlertDescription>
              {preview.matching === 0
                ? "No contacts match these filters."
                : "Every matching number is already in an earlier batch. Turn on Export again to reuse the oldest ones."}
            </AlertDescription>
          </Alert>
        ) : preview.repeatsFullList ? (
          <Alert>
            <AlertTitle>This repeats the full list</AlertTitle>
            <AlertDescription>
              Only {formatCount(preview.matching)} numbers match, so this file
              will include numbers you already exported.
            </AlertDescription>
          </Alert>
        ) : preview.previouslyExportedInBatch > 0 ? (
          <Alert>
            <AlertTitle>Includes previously exported numbers</AlertTitle>
            <AlertDescription>
              {formatCount(preview.previouslyExportedInBatch)} numbers in this
              batch were exported before. They are the ones sent out least
              recently.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onExportClick}
            disabled={!canExport}
          >
            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
            {isExporting
              ? "Exporting…"
              : `Export ${formatCount(preview.batchSize)} numbers`}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isExporting) setConfirmOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!isExporting}>
          <DialogHeader>
            <DialogTitle>Export numbers again?</DialogTitle>
            <DialogDescription>
              This batch includes{" "}
              {formatCount(preview.previouslyExportedInBatch)} numbers you have
              already exported
              {preview.newInBatch > 0
                ? ` and ${formatCount(preview.newInBatch)} new numbers`
                : ""}
              . Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={runExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin" /> : null}
              Export anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function PreviewStat({
  label,
  value,
  hint,
  pending,
}: {
  label: string
  value: string
  hint?: string
  pending: boolean
}) {
  return (
    <div className="rounded-lg border px-3 py-2.5">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-medium tabular-nums ${pending ? "opacity-50" : ""}`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
