import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LEADS_PAGE_SIZE, type LeadListQuery } from "@/types/lead"

import { LeadsList } from "./leads-list"
import {
  hasLeadFilters,
  leadListSkip,
  parseLeadListQuery,
} from "./leads-query"

function leadListWhere(userId: string, query: LeadListQuery) {
  return {
    userId,
    ...(query.q
      ? {
          OR: [
            { name: { startsWith: query.q, mode: "insensitive" as const } },
            { mobile: { startsWith: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.location ? { location: query.location } : {}),
    ...(query.exported === "never" ? { lastExportedAt: null } : {}),
    ...(query.exported === "yes" ? { lastExportedAt: { not: null } } : {}),
    ...(query.origin === "imported" ? { importId: { not: null } } : {}),
    ...(query.origin === "manual" ? { importId: null } : {}),
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return redirect("/login")

  const query = parseLeadListQuery(await searchParams)
  const userId = session.user.id
  const where = leadListWhere(userId, query)
  const skip = leadListSkip(query)

  const [leads, total, totalAll, sources, locations] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: LEADS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        location: true,
        source: true,
        createdAt: true,
        tags: {
          select: { id: true, title: true, color: true },
          orderBy: { title: "asc" },
        },
      },
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { userId } }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { userId },
      orderBy: { source: "asc" },
    }),
    prisma.lead.groupBy({
      by: ["location"],
      where: { userId, location: { not: null } },
      orderBy: { location: "asc" },
    }),
  ])

  const pages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE))
  if (query.page > pages && total > 0) {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.source) params.set("source", query.source)
    if (query.location) params.set("location", query.location)
    if (query.exported) params.set("exported", query.exported)
    if (query.origin) params.set("origin", query.origin)
    params.set("page", String(pages))
    redirect(`/leads?${params.toString()}`)
  }

  return (
    <LeadsList
      leads={leads.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      }))}
      query={query}
      total={total}
      emptyLibrary={totalAll === 0}
      filtered={hasLeadFilters(query)}
      sources={sources.map((item) => item.source)}
      locations={locations.flatMap((item) =>
        item.location ? [item.location] : [],
      )}
    />
  )
}
