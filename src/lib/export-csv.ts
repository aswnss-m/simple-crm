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

export function tagTitlesForIds(
  tagIds: number[] | undefined,
  tags: { id: number; title: string }[],
) {
  if (!tagIds || tagIds.length === 0) return []
  const titles = new Map(tags.map((tag) => [tag.id, tag.title]))
  return tagIds.flatMap((id) => {
    const title = titles.get(id)
    return title ? [title] : []
  })
}

export function buildExportFileName(
  filters: ExportFilters,
  leadCount: number,
  createdAt = new Date(),
  tagTitles: string[] = [],
) {
  const parts = ["contacts", format(createdAt, "yyyy-MM-dd-HHmm")]
  if (filters.location) parts.push(slugPart(filters.location))
  if (filters.source) parts.push(slugPart(filters.source))
  if (tagTitles.length > 0) {
    parts.push(slugPart(tagTitles.slice(0, 2).join("-")))
  }
  parts.push(String(leadCount))
  return `${parts.filter(Boolean).join("-")}${filters.format === "numbers" ? ".txt" : ".csv"}`
}

export function exportFilterLabel(
  filters: ExportFilters | null,
  tags: { id: number; title: string }[] = [],
) {
  if (!filters) return "All contacts"
  const parts: string[] = []
  if (filters.location) parts.push(filters.location)
  if (filters.source) parts.push(filters.source)
  const tagTitles = tagTitlesForIds(filters.tags, tags)
  if (tagTitles.length > 0) parts.push(tagTitles.join(", "))
  parts.push(
    filters.includePreviouslyExported
      ? "including previously exported"
      : "new numbers only",
  )
  return parts.join(" · ")
}
