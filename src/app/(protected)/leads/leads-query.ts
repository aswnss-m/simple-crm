import {
  LEADS_PAGE_SIZE,
  leadListQuerySchema,
  type LeadListQuery,
} from "@/types/lead"
import { parseTagIds } from "@/lib/tag-filter"

function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

const emptyQuery: LeadListQuery = {
  q: undefined,
  source: undefined,
  location: undefined,
  exported: undefined,
  origin: undefined,
  mobile: undefined,
  tags: [],
  page: 1,
}

export function parseLeadListQuery(
  params: Record<string, string | string[] | undefined>,
): LeadListQuery {
  const parsed = leadListQuerySchema.safeParse({
    q: firstParam(params, "q"),
    source: firstParam(params, "source"),
    location: firstParam(params, "location"),
    exported: firstParam(params, "exported") || undefined,
    origin: firstParam(params, "origin") || undefined,
    mobile: firstParam(params, "mobile") || undefined,
    tags: parseTagIds(params.tag),
    page: firstParam(params, "page") ?? 1,
  })

  return parsed.success ? parsed.data : emptyQuery
}

export function hasLeadFilters(query: LeadListQuery) {
  return Boolean(
    query.q ||
      query.source ||
      query.location ||
      query.exported ||
      query.origin ||
      query.mobile ||
      query.tags.length > 0,
  )
}

export function leadListHref(query: LeadListQuery, page = query.page) {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.source) params.set("source", query.source)
  if (query.location) params.set("location", query.location)
  if (query.exported) params.set("exported", query.exported)
  if (query.origin) params.set("origin", query.origin)
  if (query.mobile) params.set("mobile", query.mobile)
  if (query.tags.length > 0) params.set("tag", query.tags.join(","))
  if (page > 1) params.set("page", String(page))
  const search = params.toString()
  return search ? `/leads?${search}` : "/leads"
}

export function leadListSkip(query: LeadListQuery) {
  return (query.page - 1) * LEADS_PAGE_SIZE
}

export function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE))
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
