"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ContactRound, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { isNumericMobile } from "@/lib/phone-location"
import { cn } from "@/lib/utils"
import { LEADS_PAGE_SIZE, type LeadListItem, type LeadListQuery } from "@/types/lead"
import type { Tag } from "@/types/tag"

import { deleteInvalidMobileLeads } from "./leads.action"
import { LeadsFilters } from "./leads-filters"
import { LeadsPagination } from "./leads-pagination"
import { leadListHref } from "./leads-query"

export function LeadsList({
  leads,
  query,
  total,
  emptyLibrary,
  filtered,
  invalidMobileCount,
  sources,
  locations,
  tags,
}: {
  leads: LeadListItem[]
  query: LeadListQuery
  total: number
  emptyLibrary: boolean
  filtered: boolean
  invalidMobileCount: number
  sources: string[]
  locations: string[]
  tags: Tag[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const from = total === 0 ? 0 : (query.page - 1) * LEADS_PAGE_SIZE + 1
  const to = Math.min(query.page * LEADS_PAGE_SIZE, total)
  const reviewingInvalid = query.mobile === "invalid"
  const invalidLabel =
    invalidMobileCount === 1
      ? "1 contact has text in the mobile field"
      : `${invalidMobileCount.toLocaleString()} contacts have text in the mobile field`

  function confirmDeleteInvalid() {
    startTransition(async () => {
      const result = await deleteInvalidMobileLeads()
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setDeleteOpen(false)
      if (result.deletedCount === 0) {
        toast.message("No contacts with invalid numbers were left.")
      } else {
        toast.success(
          result.deletedCount === 1
            ? "Deleted 1 contact with an invalid number."
            : `Deleted ${result.deletedCount.toLocaleString()} contacts with invalid numbers.`,
        )
      }
      router.replace("/leads")
      router.refresh()
    })
  }

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
              tags={tags}
              startTransition={startTransition}
            />
          )}

          {emptyLibrary || invalidMobileCount === 0 ? null : (
            <div className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{invalidLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {reviewingInvalid
                    ? "Open a contact to replace the text with a number, or delete them all. These will not go out in exports."
                    : "Likely leftover from an old CSV import. They will not go out in exports until the number is fixed."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {reviewingInvalid ? (
                  <Link
                    href={leadListHref({ ...query, mobile: undefined, page: 1 })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Show all
                  </Link>
                ) : (
                  <Link
                    href={leadListHref({ ...query, mobile: "invalid", page: 1 })}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Review
                  </Link>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete all
                </Button>
              </div>
            </div>
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
            <div
              className={cn(
                "rounded-lg border transition-opacity duration-200",
                isPending && "pointer-events-none opacity-60",
              )}
            >
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
                          onClick={(event) => event.stopPropagation()}
                        >
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell
                        className={cn(
                          !isNumericMobile(lead.mobile) && "text-destructive",
                        )}
                      >
                        {lead.mobile}
                      </TableCell>
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

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!isPending) setDeleteOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Delete invalid numbers</DialogTitle>
            <DialogDescription>
              Delete {invalidMobileCount.toLocaleString()}{" "}
              {invalidMobileCount === 1 ? "contact" : "contacts"} whose mobile
              field is text instead of a number? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteInvalid}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete contacts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
