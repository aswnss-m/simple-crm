import { z } from "zod"

const emptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)

export const MIN_EXPORT_LIMIT = 500
export const MAX_EXPORT_LIMIT = 10_000
export const EXPORT_LIMIT_STEP = 500
export const DEFAULT_EXPORT_LIMIT = 10_000
export const EXPORT_DETAIL_PAGE_SIZE = 50
export const EXPORT_PREVIEW_ROWS = 8

export function clampExportLimit(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_EXPORT_LIMIT
  const rounded = Math.round(value / EXPORT_LIMIT_STEP) * EXPORT_LIMIT_STEP
  return Math.min(MAX_EXPORT_LIMIT, Math.max(MIN_EXPORT_LIMIT, rounded))
}

export const exportFormatSchema = z.enum(["csv", "numbers"])
export type ExportFormat = z.infer<typeof exportFormatSchema>

export const exportFiltersSchema = z.object({
  source: emptyString,
  location: emptyString,
  includePreviouslyExported: z.boolean(),
  limit: z.number().int().min(1).max(MAX_EXPORT_LIMIT).transform(clampExportLimit),
  format: exportFormatSchema,
})

export const exportInputSchema = exportFiltersSchema

export type ExportFilters = z.infer<typeof exportFiltersSchema>

export type ExportPreviewLead = {
  id: string
  name: string
  mobile: string
  location: string | null
  source: string
}

export type ExportPreview = {
  matching: number
  neverExported: number
  previouslyExported: number
  batchSize: number
  newInBatch: number
  previouslyExportedInBatch: number
  remainingNeverExported: number
  repeatsFullList: boolean
}

export type ExportListItem = {
  id: string
  fileName: string | null
  leadCount: number
  createdAt: string
  filters: ExportFilters | null
}

export type ExportActionResult =
  | {
      ok: true
      id: string
      fileName: string
      leadCount: number
      previouslyExportedCount: number
    }
  | { ok: false; error: string }

export type ExportPreviewResult =
  | { ok: true; preview: ExportPreview; samples: ExportPreviewLead[] }
  | { ok: false; error: string }

export const DEFAULT_EXPORT_FILTERS: ExportFilters = {
  source: undefined,
  location: undefined,
  includePreviouslyExported: false,
  limit: DEFAULT_EXPORT_LIMIT,
  format: "csv",
}

export function parseStoredExportFilters(value: unknown): ExportFilters | null {
  const parsed = exportFiltersSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
