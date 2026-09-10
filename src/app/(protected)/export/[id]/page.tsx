import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { FileDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { auth } from "@/lib/auth"
import { exportFilterLabel } from "@/lib/export-csv"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import {
  EXPORT_DETAIL_PAGE_SIZE,
  parseStoredExportFilters,
} from "@/types/export"

import { pageCount, visiblePages } from "../export-query"

const countFormat = new Intl.NumberFormat("en-IN")

export default async function ExportBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return redirect("/login")

  const { id } = await params
  const query = await searchParams
  const pageParam = Array.isArray(query.page) ? query.page[0] : query.page
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1)

  const skip = (page - 1) * EXPORT_DETAIL_PAGE_SIZE

  const [record, items] = await Promise.all([
    prisma.export.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        fileName: true,
        leadCount: true,
        createdAt: true,
        filters: true,
      },
    }),
    prisma.exportItem.findMany({
      where: { exportId: id, export: { userId: session.user.id } },
      skip,
      take: EXPORT_DETAIL_PAGE_SIZE,
      orderBy: { leadId: "asc" },
      select: {
        lead: {
          select: {
            id: true,
            name: true,
            mobile: true,
            location: true,
            source: true,
            exportCount: true,
          },
        },
      },
    }),
  ])

  if (!record) notFound()

  const pages = pageCount(record.leadCount, EXPORT_DETAIL_PAGE_SIZE)
  if (page > pages && record.leadCount > 0) {
    redirect(`/export/${id}?page=${pages}`)
  }

  const filters = parseStoredExportFilters(record.filters)
  const from = record.leadCount === 0 ? 0 : skip + 1
  const to = Math.min(page * EXPORT_DETAIL_PAGE_SIZE, record.leadCount)
  const current = Math.min(page, pages)
  const pageItems = visiblePages(current, pages)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title={record.fileName ?? "Export batch"}
        description={`${format(record.createdAt, "d MMM yyyy, h:mm a")} · ${formatDistanceToNow(record.createdAt, { addSuffix: true })}`}
      >
        <Link
          href="/export"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          All exports
        </Link>
        <Link
          href={`/export/${record.id}/download`}
          className={cn(buttonVariants())}
        >
          <FileDown />
          Download
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {countFormat.format(record.leadCount)} numbers
        </Badge>
        <Badge variant="outline">{exportFilterLabel(filters)}</Badge>
        {filters?.format === "numbers" ? (
          <Badge variant="outline">Numbers only</Badge>
        ) : (
          <Badge variant="outline">CSV</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Numbers in this batch</CardTitle>
          <CardDescription>
            {record.leadCount === 0
              ? "No numbers left in this batch"
              : `Showing ${countFormat.format(from)}–${countFormat.format(to)} of ${countFormat.format(record.leadCount)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-sm font-medium">No numbers to show</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contacts in this batch may have been deleted.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Times exported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.lead.id}>
                      <TableCell>
                        <Link
                          href={`/leads/${item.lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.lead.name}
                        </Link>
                      </TableCell>
                      <TableCell>{item.lead.mobile}</TableCell>
                      <TableCell>{item.lead.location ?? "—"}</TableCell>
                      <TableCell>{item.lead.source}</TableCell>
                      <TableCell className="tabular-nums">
                        {countFormat.format(item.lead.exportCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {record.leadCount > EXPORT_DETAIL_PAGE_SIZE ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {countFormat.format(from)}–{countFormat.format(to)} of{" "}
                {countFormat.format(record.leadCount)}
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        current <= 1
                          ? `/export/${id}`
                          : current === 2
                            ? `/export/${id}`
                            : `/export/${id}?page=${current - 1}`
                      }
                      aria-disabled={current <= 1}
                      className={
                        current <= 1 ? "pointer-events-none opacity-50" : undefined
                      }
                    />
                  </PaginationItem>
                  {pageItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href={
                            item === 1
                              ? `/export/${id}`
                              : `/export/${id}?page=${item}`
                          }
                          isActive={item === current}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href={`/export/${id}?page=${Math.min(pages, current + 1)}`}
                      aria-disabled={current >= pages}
                      className={
                        current >= pages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
