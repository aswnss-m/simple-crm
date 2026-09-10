"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ContactRound, Plus, Search } from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { LEADS_PAGE_SIZE, type LeadListItem, type LeadListQuery } from "@/types/lead"

import { LeadsFilters } from "./leads-filters"
import { LeadsPagination } from "./leads-pagination"

export function LeadsList({
  leads,
  query,
  total,
  emptyLibrary,
  filtered,
  sources,
  locations,
}: {
  leads: LeadListItem[]
  query: LeadListQuery
  total: number
  emptyLibrary: boolean
  filtered: boolean
  sources: string[]
  locations: string[]
}) {
  const router = useRouter()
  const from = total === 0 ? 0 : (query.page - 1) * LEADS_PAGE_SIZE + 1
  const to = Math.min(query.page * LEADS_PAGE_SIZE, total)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Contacts"
        description="Everyone in your CRM. Open a contact to view or edit details."
      >
        <Link href="/leads/new" className={buttonVariants()}>
          <Plus />
          New contact
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your contacts</CardTitle>
          <CardDescription>
            {emptyLibrary
              ? "No contacts yet"
              : total === 0
                ? "No matching contacts"
                : `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emptyLibrary ? null : (
            <LeadsFilters
              query={query}
              sources={sources}
              locations={locations}
            />
          )}

          {emptyLibrary ? (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <ContactRound className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No contacts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add one by hand, or import a CSV.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/leads/new"
                  className={buttonVariants({ size: "sm" })}
                >
                  <Plus />
                  New contact
                </Link>
                <Link
                  href="/import"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Import CSV
                </Link>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Search className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No matching contacts</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered
                  ? "Try a different search or clear the filters."
                  : "Nothing to show on this page."}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Exports</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.mobile}</TableCell>
                      <TableCell>{lead.email ?? "—"}</TableCell>
                      <TableCell>{lead.location ?? "—"}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {lead.exportCount > 0 ? `${lead.exportCount}×` : "Never"}
                      </TableCell>
                      <TableCell>
                        {lead.tags.length > 0 ? (
                          <div className="flex max-w-56 flex-wrap gap-1">
                            {lead.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="font-normal"
                              >
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.title}
                              </Badge>
                            ))}
                            {lead.tags.length > 3 ? (
                              <Badge variant="outline">
                                +{lead.tags.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <LeadsPagination query={query} total={total} />
        </CardContent>
      </Card>
    </div>
  )
}
