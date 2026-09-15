import type { ExportFilters, ExportPreview } from "@/types/export"
import { tagFilterWhere } from "@/lib/tag-filter"

export const exportLeadSelect = {
  id: true,
  name: true,
  mobile: true,
  location: true,
  source: true,
} as const

export const exportLeadOrderBy = [
  { lastExportedAt: { sort: "asc" as const, nulls: "first" as const } },
  { createdAt: "asc" as const },
]

function excludeInvalidMobileIds(ids: string[]) {
  return ids.length > 0 ? { id: { notIn: ids } } : {}
}

export function exportBaseWhere(
  userId: string,
  filters: Pick<ExportFilters, "source" | "location" | "tags">,
  invalidIds: string[],
) {
  return {
    userId,
    ...excludeInvalidMobileIds(invalidIds),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.location ? { location: filters.location } : {}),
    ...tagFilterWhere(filters.tags),
  }
}

export function exportSelectWhere(
  userId: string,
  filters: ExportFilters,
  invalidIds: string[],
) {
  return {
    ...exportBaseWhere(userId, filters, invalidIds),
    ...(filters.includePreviouslyExported ? {} : { lastExportedAt: null }),
  }
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function visiblePages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const items: Array<number | "ellipsis"> = []
  for (const page of sorted) {
    const previous = items.at(-1)
    if (typeof previous === "number" && page - previous > 1) {
      items.push("ellipsis")
    }
    items.push(page)
  }

  return items
}

export function computeExportPreview(
  matching: number,
  neverExported: number,
  filters: Pick<ExportFilters, "limit" | "includePreviouslyExported">,
): ExportPreview {
  const previouslyExported = Math.max(0, matching - neverExported)
  const available = filters.includePreviouslyExported ? matching : neverExported
  const batchSize = Math.min(filters.limit, available)
  const newInBatch = Math.min(batchSize, neverExported)
  const previouslyExportedInBatch = filters.includePreviouslyExported
    ? Math.max(0, batchSize - newInBatch)
    : 0

  return {
    matching,
    neverExported,
    previouslyExported,
    batchSize,
    newInBatch,
    previouslyExportedInBatch,
    remainingNeverExported: neverExported - newInBatch,
    repeatsFullList:
      filters.includePreviouslyExported &&
      matching > 0 &&
      matching <= filters.limit,
  }
}
