import { z } from "zod"

import {
  isNumericMobile,
  MOBILE_FORMAT_ERROR,
  stripMobileSpaces,
} from "@/lib/phone-location"
import { TAG_COLORS } from "./tag"

export { TAG_COLORS }
export type { Tag as ImportTag } from "./tag"

export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_IMPORT_ROWS = 5_000
export const PREVIEW_ROWS = 25
export const ERROR_PREVIEW_ROWS = 50

export const TEMPLATE_COLUMNS = ["name", "mobile", "email", "location"] as const
export const REQUIRED_COLUMNS = ["name", "mobile"] as const

export type TemplateColumn = (typeof TEMPLATE_COLUMNS)[number]

export const COLUMN_LABELS: Record<TemplateColumn, string> = {
  name: "Name",
  mobile: "Mobile",
  email: "Email",
  location: "Location",
}

export const CSV_TEMPLATE = [
  TEMPLATE_COLUMNS.join(","),
  "Jane Doe,+14155552671,jane@example.com,Austin",
  "John Smith,+447911123456,,",
].join("\n")

export const PARSER_OPTIONS = {
  header: true,
  skipEmptyLines: "greedy" as const,
  dynamicTyping: false,
  transformHeader: (header: string) =>
    header.replace(/^\uFEFF/, "").toLowerCase().trim(),
}

export type CsvRow = Record<string, unknown>

export type MappedLead = {
  name: string
  mobile: string
  email?: string
  location?: string
}

export type InvalidMobileRow = {
  rowNumber: number
  name: string
  mobile: string
}

export const csvLeadRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  mobile: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .refine((value) => isNumericMobile(value), {
      message: MOBILE_FORMAT_ERROR,
    })
    .transform((value) => stripMobileSpaces(value)),
  email: z
    .union([z.email().max(320), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
})

export const importCsvSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  source: z.string().trim().min(1).max(200),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  rows: z.array(csvLeadRowSchema).min(1).max(MAX_IMPORT_ROWS),
})

export type CsvLeadRow = z.infer<typeof csvLeadRowSchema>
export type ImportCsvInput = z.infer<typeof importCsvSchema>

export type ImportCsvResult =
  | {
      ok: true
      importId: string
      successCount: number
      errorCount: number
      duplicateCount: number
    }
  | {
      ok: false
      error: string
    }
