import { Suspense } from "react"
import Link from "next/link"
import { Plus, Upload } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"

import { OverviewBody } from "./overview-body"
import { OverviewSkeleton } from "./overview-skeleton"

export default function OverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Your contact book at a glance."
      >
        <Link href="/import" className={buttonVariants({ variant: "outline" })}>
          <Upload />
          Import CSV
        </Link>
        <Link href="/leads/new" className={buttonVariants()}>
          <Plus />
          New contact
        </Link>
      </PageHeader>

      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewBody />
      </Suspense>
    </div>
  )
}
