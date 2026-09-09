"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import type { Tag } from "@/types/tag"

import { LeadForm, type LeadFormValues } from "../lead-form"
import { createLead } from "../leads.action"

const emptyValues: LeadFormValues = {
  name: "",
  mobile: "",
  email: "",
  location: "",
  source: "Manual",
  notes: "",
  tags: [],
}

export function NewLeadForm({ tags }: { tags: Tag[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<LeadFormValues>(emptyValues)

  function save() {
    startTransition(async () => {
      const result = await createLead(values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Contact created.")
      router.push(`/leads/${result.id}`)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="New contact"
        description="Add one person to your CRM."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>
            Name and mobile are required. Mobile numbers must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadForm
            tags={tags}
            values={values}
            onChange={setValues}
            onSubmit={save}
            isPending={isPending}
            submitLabel={isPending ? "Saving…" : "Create contact"}
            extraActions={
              <>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  render={<Link href="/leads" />}
                >
                  Cancel
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
