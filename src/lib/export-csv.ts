import { format } from "date-fns"

import type { ExportFilters, ExportFormat } from "@/types/export"

export type ExportCsvLead = {
  id: string
  name: string
  mobile: string
  location: string | null
  source: string
}

function csvField(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function leadsToExportFile(leads: ExportCsvLead[], formatType: ExportFormat) {
  if (formatType === "numbers") {
    return leads.map((lead) => lead.mobile).join("\n")
  }

  const rows = [
    ["Name", "Mobile", "Location", "Source", "ID"].join(","),
    ...leads.map((lead) =>
      [
        csvField(lead.name),
        csvField(lead.mobile),
        csvField(lead.location ?? ""),
        csvField(lead.source),
        csvField(lead.id),
      ].join(","),
    ),
  ]

  return `\uFEFF${rows.join("\n")}`
}

export function exportMimeType(formatType: ExportFormat) {
  return formatType === "numbers" ? "text/plain;charset=utf-8" : "text/csv;charset=utf-8"
}

function slugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
}

export function buildExportFileName(
  filters: ExportFilters,
  leadCount: number,
  createdAt = new Date(),
) {
  const parts = ["contacts", format(createdAt, "yyyy-MM-dd-HHmm")]
  if (filters.location) parts.push(slugPart(filters.location))
  if (filters.source) parts.push(slugPart(filters.source))
  parts.push(String(leadCount))
  return `${parts.filter(Boolean).join("-")}${filters.format === "numbers" ? ".txt" : ".csv"}`
}

export function exportFilterLabel(filters: ExportFilters | null) {
  if (!filters) return "All contacts"
  const parts: string[] = []
  if (filters.location) parts.push(filters.location)
  if (filters.source) parts.push(filters.source)
  parts.push(
    filters.includePreviouslyExported
      ? "including previously exported"
      : "new numbers only",
  )
  return parts.join(" · ")
}
