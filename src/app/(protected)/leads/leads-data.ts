import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/prisma"
import { leadCacheTag } from "@/lib/lead-cache"
import { tagFilterWhere } from "@/lib/tag-filter"
import { LEADS_PAGE_SIZE, type LeadListItem, type LeadListQuery } from "@/types/lead"
import type { Tag } from "@/types/tag"

import { leadListSkip } from "./leads-query"

function leadListWhere(userId: string, query: LeadListQuery) {
  return {
    userId,
    ...(query.q
      ? {
          OR: [
            { name: { startsWith: query.q, mode: "insensitive" as const } },
            { mobile: { startsWith: query.q, mode: "insensitive" as const } },
            {
              tags: {
                some: {
                  title: { contains: query.q, mode: "insensitive" as const },
                },
              },
            },
          ],
        }
      : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.location ? { location: query.location } : {}),
    ...tagFilterWhere(query.tags),
    ...(query.exported === "never" ? { lastExportedAt: null } : {}),
    ...(query.exported === "yes" ? { lastExportedAt: { not: null } } : {}),
    ...(query.origin === "imported" ? { importId: { not: null } } : {}),
    ...(query.origin === "manual" ? { importId: null } : {}),
  }
}

export type LeadListPage = {
  leads: LeadListItem[]
  total: number
  totalAll: number
  sources: string[]
  locations: string[]
  tags: Tag[]
}

async function queryLeadList(
  userId: string,
  queryKey: string,
): Promise<LeadListPage> {
  const query = JSON.parse(queryKey) as LeadListQuery
  const where = leadListWhere(userId, query)
  const skip = leadListSkip(query)

  const [leads, total, totalAll, sources, locations, tags] = await Promise.all([
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
        exportCount: true,
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
    prisma.tag.findMany({
      where: { userId },
      orderBy: { title: "asc" },
      select: { id: true, title: true, color: true },
    }),
  ])

  return {
    leads: leads.map((lead) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    })),
    total,
    totalAll,
    sources: sources.map((item) => item.source),
    locations: locations.flatMap((item) =>
      item.location ? [item.location] : [],
    ),
    tags,
  }
}

export async function loadLeadList(userId: string, query: LeadListQuery) {
  return unstable_cache(queryLeadList, ["lead-list"], {
    tags: [leadCacheTag(userId)],
    revalidate: 120,
  })(userId, JSON.stringify(query))
}
