"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import CSVReader, { type IFileInfo } from "@uiw/react-csv-reader"
import {
  CheckCircle2,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  UploadCloud,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import {
  COLUMN_LABELS,
  CSV_TEMPLATE,
  MAX_FILE_SIZE,
  MAX_IMPORT_ROWS,
  PARSER_OPTIONS,
  PREVIEW_ROWS,
  TAG_COLORS,
  TEMPLATE_COLUMNS,
  type CsvRow,
  type ImportCsvResult,
  type ImportTag,
  type MappedLead,
} from "@/types/csv"

import { importCsv } from "./csv.action"
import {
  formatBytes,
  hasTemplateHeaders,
  mapRows,
  sourceFromFileName,
} from "./csv-map"

const COLLAPSED_TAG_COUNT = 3

type ImportPhase = "form" | "importing" | "success" | "error"
type ImportSuccess = Extract<ImportCsvResult, { ok: true }>

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "contacts-template.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export function ImportForm({ tags }: { tags: ImportTag[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [fileInfo, setFileInfo] = useState<IFileInfo | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [source, setSource] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const [selectedTagsOpen, setSelectedTagsOpen] = useState(false)
  const [availableTagsOpen, setAvailableTagsOpen] = useState(false)
  const [phase, setPhase] = useState<ImportPhase>("form")
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportSuccess | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const completeTimer = useRef<number>(0)
  const busy = phase === "importing"

  const mapped = useMemo(() => mapRows(rows), [rows])
  const preview = useMemo(
    () => mapped.valid.slice(0, PREVIEW_ROWS),
    [mapped.valid],
  )
  const canImport =
    mapped.valid.length > 0 && mapped.valid.length <= MAX_IMPORT_ROWS
  const tagQuery = tagDraft.trim().toLowerCase()
  const unusedTags = useMemo(
    () =>
      tags.filter(
        (tag) =>
          !selectedTags.some(
            (selected) => selected.toLowerCase() === tag.title.toLowerCase(),
          ),
      ),
    [selectedTags, tags],
  )
  const matchingUnusedTags = useMemo(
    () =>
      tagQuery
        ? unusedTags.filter((tag) =>
            tag.title.toLowerCase().includes(tagQuery),
          )
        : unusedTags,
    [tagQuery, unusedTags],
  )
  const showAvailableTags = availableTagsOpen || tagQuery.length > 0
  const visibleAvailableTags = showAvailableTags
    ? matchingUnusedTags
    : matchingUnusedTags.slice(0, COLLAPSED_TAG_COUNT)
  const hiddenAvailableCount =
    matchingUnusedTags.length - visibleAvailableTags.length
  const selectedTagItems = useMemo(() => {
    const colorsByTitle = new Map(
      tags.map((tag) => [tag.title.toLowerCase(), tag.color]),
    )

    return selectedTags.map((title, index) => ({
      title,
      color:
        colorsByTitle.get(title.toLowerCase()) ??
        TAG_COLORS[index % TAG_COLORS.length],
    }))
  }, [selectedTags, tags])
  const visibleSelectedTags = selectedTagsOpen
    ? selectedTagItems
    : selectedTagItems.slice(0, COLLAPSED_TAG_COUNT)
  const hiddenSelectedCount = selectedTagItems.length - visibleSelectedTags.length
  const draftTitle = tagDraft.trim()
  const canAddDraft =
    draftTitle.length > 0 &&
    !selectedTags.some((tag) => tag.toLowerCase() === draftTitle.toLowerCase())

  useEffect(() => {
    if (phase !== "importing") return

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current
        return current + Math.max(0.6, (90 - current) * 0.08)
      })
    }, 180)

    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    return () => window.clearTimeout(completeTimer.current)
  }, [])

  function resetImportState() {
    window.clearTimeout(completeTimer.current)
    setPhase("form")
    setProgress(0)
    setImportResult(null)
    setImportError(null)
  }

  function resetFile() {
    setRows([])
    setFileInfo(null)
    setIsDragging(false)
    setDialogOpen(false)
    setSource("")
    setSelectedTags([])
    setTagDraft("")
    setSelectedTagsOpen(false)
    setAvailableTagsOpen(false)
    resetImportState()
    if (inputRef.current) inputRef.current.value = ""
  }

  function addTag(title: string, options?: { keepDraft?: boolean }) {
    const next = title.trim()
    if (!next) return
    setSelectedTags((current) =>
      current.some((tag) => tag.toLowerCase() === next.toLowerCase())
        ? current
        : [...current, next],
    )
    if (!options?.keepDraft) setTagDraft("")
    setSelectedTagsOpen(true)
  }

  function commitDraftTag() {
    addTag(tagDraft)
  }

  function removeTag(title: string) {
    setSelectedTags((current) =>
      current.filter((tag) => tag.toLowerCase() !== title.toLowerCase()),
    )
  }

  function handleFileLoaded(data: unknown[], info: IFileInfo) {
    setIsDragging(false)

    if (info.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 10 MB.")
      resetFile()
      return
    }

    const parsed = (Array.isArray(data) ? data : []) as CsvRow[]
    const usable = parsed.filter((row) => row && typeof row === "object")

    if (usable.length === 0) {
      toast.error("No rows found in that CSV file.")
      resetFile()
      return
    }

    if (usable.length > MAX_IMPORT_ROWS) {
      toast.error(`CSV has more than ${MAX_IMPORT_ROWS.toLocaleString()} rows.`)
      resetFile()
      return
    }

    if (!hasTemplateHeaders(usable)) {
      toast.error("Use the template. Columns must include name and mobile.")
      resetFile()
      return
    }

    const next = mapRows(usable)
    if (next.valid.length === 0) {
      toast.error("Every row needs a name and mobile.")
      resetFile()
      return
    }

    setRows(usable)
    setFileInfo(info)
    setSource(sourceFromFileName(info.name))
    setSelectedTags([])
    setTagDraft("")
    setSelectedTagsOpen(false)
    setAvailableTagsOpen(false)
    resetImportState()
  }

  function handleImport() {
    if (!fileInfo || !canImport) return
    resetImportState()
    setDialogOpen(true)
  }

  async function confirmImport() {
    if (!fileInfo || !canImport || busy) return
    const nextSource = source.trim()
    if (!nextSource) {
      toast.error("Add a source for these contacts.")
      return
    }

    const tagsToImport = [...selectedTags]
    if (
      draftTitle &&
      !tagsToImport.some((tag) => tag.toLowerCase() === draftTitle.toLowerCase())
    ) {
      tagsToImport.push(draftTitle)
    }

    setImportError(null)
    setImportResult(null)
    setProgress(12)
    setPhase("importing")

    const result = await importCsv({
      fileName: fileInfo.name,
      source: nextSource,
      tags: tagsToImport,
      rows: mapped.valid,
    })

    if (!result.ok) {
      setImportError(result.error)
      setPhase("error")
      return
    }

    setImportResult(result)
    setProgress(100)
    window.clearTimeout(completeTimer.current)
    completeTimer.current = window.setTimeout(() => setPhase("success"), 400)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload your file</CardTitle>
        <CardDescription>
          Download the template, fill it in, and upload the CSV. Blank
          locations are filled from the phone country code.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {fileInfo ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fileInfo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(fileInfo.size)} · {mapped.valid.length} contacts
                    {mapped.invalidCount > 0
                      ? ` · ${mapped.invalidCount} skipped`
                      : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={resetFile}
                disabled={busy}
                aria-label="Remove file"
              >
                <X />
              </Button>
            </div>

            {preview.length > 0 ? (
              <CsvPreviewTable
                rows={preview}
                total={mapped.valid.length}
              />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetFile}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!canImport || busy}
              >
                Import {mapped.valid.length} contacts
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "relative flex min-h-70 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 px-6 text-center transition-colors",
                isDragging
                  ? "border-primary bg-muted/40"
                  : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-background shadow-sm">
                <UploadCloud className="size-6 text-muted-foreground" />
              </div>

              <h3 className="font-medium">Drop your CSV file here</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Drag and drop your file here, or choose a file from your
                computer.
              </p>
              <Button type="button" className="pointer-events-none mt-5">
                Choose file
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                CSV up to 10 MB · {MAX_IMPORT_ROWS.toLocaleString()} rows max
              </p>

              <CSVReader
                ref={inputRef}
                aria-label="Upload CSV file"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                parserOptions={PARSER_OPTIONS}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={() => setIsDragging(false)}
                onError={() => {
                  toast.error("Could not read that CSV file.")
                  resetFile()
                }}
                onFileLoaded={handleFileLoaded}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Download className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download the CSV template, then upload your filled file.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
              >
                Download template
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (busy) return
          if (!open) {
            if (phase === "success") {
              resetFile()
              return
            }
            setDialogOpen(false)
            setTagDraft("")
            setSelectedTagsOpen(false)
            setAvailableTagsOpen(false)
            if (phase === "error") resetImportState()
            return
          }
          setDialogOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>
              {phase === "importing"
                ? "Importing contacts"
                : phase === "success"
                  ? "Import complete"
                  : phase === "error"
                    ? "Import failed"
                    : "Import details"}
            </DialogTitle>
            <DialogDescription>
              {phase === "importing"
                ? `Saving ${mapped.valid.length.toLocaleString()} contacts. Keep this window open.`
                : phase === "success"
                  ? "Your file has been processed."
                  : phase === "error"
                    ? "Nothing was imported. You can try again."
                    : `Apply a source and tags to all ${mapped.valid.length} contacts in this file.`}
            </DialogDescription>
          </DialogHeader>

          {phase === "importing" ? (
            <ImportProgressPanel
              progress={progress}
              total={mapped.valid.length}
            />
          ) : null}

          {phase === "success" && importResult ? (
            <ImportSuccessPanel result={importResult} />
          ) : null}

          {phase === "error" ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Could not import contacts</AlertTitle>
              <AlertDescription>
                {importError ?? "Please try again."}
              </AlertDescription>
            </Alert>
          ) : null}

          {phase === "form" ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="import-source">Source</FieldLabel>
                <Input
                  id="import-source"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="Website, referral, campaign…"
                  disabled={busy}
                  autoComplete="off"
                  required
                />
                <FieldDescription>
                  Where did you get this data from
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="import-tags">Tags</FieldLabel>
                {selectedTags.length > 0 ? (
                  <div className="flex max-h-24 flex-wrap items-center gap-1.5 overflow-y-auto">
                    {visibleSelectedTags.map((tag) => (
                      <Badge key={tag.title} variant="secondary" className="pr-0.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.title}
                        <button
                          type="button"
                          className="rounded-full p-0.5 hover:bg-muted"
                          onClick={() => removeTag(tag.title)}
                          disabled={busy}
                          aria-label={`Remove ${tag.title}`}
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    {hiddenSelectedCount > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() => setSelectedTagsOpen(true)}
                      >
                        +{hiddenSelectedCount} more
                      </Button>
                    ) : selectedTagsOpen &&
                      selectedTags.length > COLLAPSED_TAG_COUNT ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() => setSelectedTagsOpen(false)}
                      >
                        Show less
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                <InputGroup
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault()
                      event.stopPropagation()
                      commitDraftTag()
                    }
                  }}
                >
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="import-tags"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    placeholder="Search or add a tag"
                    disabled={busy}
                    autoComplete="off"
                  />
                  {canAddDraft ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="xs"
                        aria-label={`Add tag ${draftTitle}`}
                        disabled={busy}
                        onClick={commitDraftTag}
                      >
                        <Plus />
                        Add
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : tagDraft.length > 0 ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="Clear tag search"
                        disabled={busy}
                        onClick={() => setTagDraft("")}
                      >
                        <X />
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : null}
                </InputGroup>
                <FieldDescription>
                  Search existing tags, or type a new one and press Enter or Add.
                </FieldDescription>
                {canAddDraft &&
                !unusedTags.some(
                  (tag) => tag.title.toLowerCase() === draftTitle.toLowerCase(),
                ) ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={busy}
                    onClick={commitDraftTag}
                  >
                    <Plus />
                    Create “{draftTitle}”
                  </Button>
                ) : null}
                {unusedTags.length > 0 ? (
                  <div className="flex max-h-32 flex-wrap items-center gap-1.5 overflow-y-auto">
                    {visibleAvailableTags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        size="xs"
                        disabled={busy}
                        onClick={() => addTag(tag.title, { keepDraft: true })}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.title}
                      </Button>
                    ))}
                    {hiddenAvailableCount > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() => setAvailableTagsOpen(true)}
                      >
                        +{hiddenAvailableCount} more
                      </Button>
                    ) : null}
                    {availableTagsOpen &&
                    !tagQuery &&
                    matchingUnusedTags.length > COLLAPSED_TAG_COUNT ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={busy}
                        onClick={() => setAvailableTagsOpen(false)}
                      >
                        Show less
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Field>
            </FieldGroup>
          ) : null}

          {phase === "form" ? (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => void confirmImport()}
                disabled={busy || source.trim().length === 0}
              >
                Import {mapped.valid.length} contacts
              </Button>
            </DialogFooter>
          ) : null}

          {phase === "error" ? (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetImportState()}
              >
                Back
              </Button>
              <Button type="button" onClick={() => void confirmImport()}>
                Try again
              </Button>
            </DialogFooter>
          ) : null}

          {phase === "success" ? (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                render={<Link href="/leads" />}
              >
                View contacts
              </Button>
              <Button type="button" onClick={resetFile}>
                Done
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function importProgressLabel(progress: number) {
  if (progress < 25) return "Preparing import"
  if (progress < 55) return "Saving contacts"
  if (progress < 90) return "Applying tags"
  if (progress < 100) return "Finishing up"
  return "Import complete"
}

function ImportProgressPanel({
  progress,
  total,
}: {
  progress: number
  total: number
}) {
  const value = Math.min(100, Math.round(progress))

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-center gap-2">
        <Spinner />
        <p className="text-sm font-medium" aria-live="polite">
          Importing {total.toLocaleString()} contacts
        </p>
      </div>
      <Progress
        value={value}
        className="w-full **:data-[slot=progress-track]:h-2"
      >
        <ProgressLabel>{importProgressLabel(value)}</ProgressLabel>
        <ProgressValue />
      </Progress>
      <p className="text-xs text-muted-foreground">
        This can take a few seconds for larger files.
      </p>
    </div>
  )
}

function ImportSuccessPanel({ result }: { result: ImportSuccess }) {
  const skipped = result.duplicateCount > 0

  return (
    <Alert>
      <CheckCircle2 />
      <AlertTitle>
        {result.successCount.toLocaleString()}{" "}
        {result.successCount === 1 ? "contact" : "contacts"} imported
      </AlertTitle>
      <AlertDescription>
        {skipped
          ? `${result.duplicateCount.toLocaleString()} skipped as duplicates.`
          : "All rows in this file were added to your CRM."}
      </AlertDescription>
    </Alert>
  )
}

function CsvPreviewTable({
  rows,
  total,
}: {
  rows: MappedLead[]
  total: number
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableCaption>
          {total > PREVIEW_ROWS
            ? `Showing the first ${PREVIEW_ROWS} of ${total.toLocaleString()} contacts`
            : `${total.toLocaleString()} contacts ready to import`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            {TEMPLATE_COLUMNS.map((column) => (
              <TableHead key={column}>{COLUMN_LABELS[column]}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.mobile}-${index}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.mobile}</TableCell>
              <TableCell>{row.email ?? "—"}</TableCell>
              <TableCell>{row.location ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
