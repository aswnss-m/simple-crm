"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { PageHeader } from "@/components/page-header"
import type { LeadDetail } from "@/types/lead"
import type { Tag } from "@/types/tag"

import { LeadForm, type LeadFormValues } from "../lead-form"
import { deleteLead, updateLead } from "../leads.action"

export function LeadDetail({
  lead,
  tags,
}: {
  lead: LeadDetail
  tags: Tag[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [values, setValues] = useState<LeadFormValues>({
    name: lead.name,
    mobile: lead.mobile,
    email: lead.email ?? "",
    location: lead.location ?? "",
    source: lead.source,
    notes: lead.notes ?? "",
    tags: lead.tags.map((tag) => tag.title),
  })

  const createdLabel = formatDistanceToNow(new Date(lead.createdAt), {
    addSuffix: true,
  })
  const exportedLabel = lead.lastExportedAt
    ? formatDistanceToNow(new Date(lead.lastExportedAt), { addSuffix: true })
    : null

  function save() {
    startTransition(async () => {
      const result = await updateLead({ id: lead.id, ...values })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Contact updated.")
      router.refresh()
    })
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteLead({ id: lead.id })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Contact deleted.")
      router.push("/leads")
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={lead.name} description={lead.mobile}>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          render={<Link href="/leads" />}
        >
          All contacts
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>
            Added {createdLabel}
            {lead.importFileName ? ` · imported from ${lead.importFileName}` : ""}
            {exportedLabel ? ` · last exported ${exportedLabel}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm
            tags={tags}
            values={values}
            onChange={setValues}
            onSubmit={save}
            isPending={isPending}
            submitLabel={isPending ? "Saving…" : "Save changes"}
            extraActions={
              <>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </>
            }
          />
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
            <DialogTitle>Delete contact</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium">{lead.name}</span>? This
              cannot be undone.
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
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Delete contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
