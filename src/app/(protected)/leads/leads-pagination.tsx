import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { LEADS_PAGE_SIZE, type LeadListQuery } from "@/types/lead"

import { leadListHref, pageCount, visiblePages } from "./leads-query"

export function LeadsPagination({
  query,
  total,
}: {
  query: LeadListQuery
  total: number
}) {
  const pages = pageCount(total)
  if (total === 0 || pages <= 1) return null

  const current = Math.min(query.page, pages)
  const items = visiblePages(current, pages)
  const from = (current - 1) * LEADS_PAGE_SIZE + 1
  const to = Math.min(current * LEADS_PAGE_SIZE, total)

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {from.toLocaleString()}–{to.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={leadListHref(query, Math.max(1, current - 1))}
              aria-disabled={current <= 1}
              className={current <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href={leadListHref(query, item)}
                  isActive={item === current}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href={leadListHref(query, Math.min(pages, current + 1))}
              aria-disabled={current >= pages}
              className={
                current >= pages ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
