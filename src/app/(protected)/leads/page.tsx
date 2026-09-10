import { redirect } from "next/navigation"

import { getSession } from "@/lib/session"
import { LEADS_PAGE_SIZE } from "@/types/lead"

import { LeadsList } from "./leads-list"
import { loadLeadList } from "./leads-data"
import {
  hasLeadFilters,
  leadListHref,
  parseLeadListQuery,
} from "./leads-query"

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getSession()

  if (!session) return redirect("/login")

  const query = parseLeadListQuery(await searchParams)
  const { leads, total, totalAll, sources, locations, tags } = await loadLeadList(
    session.user.id,
    query,
  )

  const pages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE))
  if (query.page > pages && total > 0) {
    redirect(leadListHref(query, pages))
  }

  return (
    <LeadsList
      leads={leads}
      query={query}
      total={total}
      emptyLibrary={totalAll === 0}
      filtered={hasLeadFilters(query)}
      sources={sources}
      locations={locations}
      tags={tags}
    />
  )
}
