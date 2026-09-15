import { format, formatDistanceToNow, startOfMonth, subMonths } from "date-fns"

import { prisma } from "@/lib/prisma"
import { countInvalidMobiles } from "@/lib/mobile-query"

import type {
  OverviewBreakdownItem,
  OverviewData,
} from "./overview-types"

export const OVERVIEW_PREVIEW_SIZE = 8
export const OVERVIEW_BREAKDOWN_LIMIT = 8

function toCount(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value
}

export async function loadOverview(userId: string): Promise<OverviewData> {
  const thisMonthStart = startOfMonth(new Date())
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1))

  const [
    total,
    addedThisMonth,
    addedLastMonth,
    unknownLocationCount,
    topLocations,
    topSources,
    recent,
    locationCountRows,
    invalidMobileCount,
  ] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({
      where: { userId, createdAt: { gte: thisMonthStart } },
    }),
    prisma.lead.count({
      where: {
        userId,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.lead.count({ where: { userId, location: null } }),
    prisma.lead.groupBy({
      by: ["location"],
      where: { userId, location: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: OVERVIEW_BREAKDOWN_LIMIT,
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { userId },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: OVERVIEW_BREAKDOWN_LIMIT,
    }),
    prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: OVERVIEW_PREVIEW_SIZE,
      select: {
        id: true,
        name: true,
        mobile: true,
        location: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT location)::bigint AS count
      FROM lead
      WHERE "userId" = ${userId}
        AND location IS NOT NULL
    `,
    countInvalidMobiles(userId),
  ])

  const topLocationTotal = topLocations.reduce(
    (sum, row) => sum + row._count._all,
    0,
  )
  const otherLocationCount = Math.max(
    0,
    total - unknownLocationCount - topLocationTotal,
  )
  const locations: OverviewBreakdownItem[] = topLocations.flatMap((row) =>
    row.location
      ? [
          {
            label: row.location,
            count: row._count._all,
            href: `/leads?location=${encodeURIComponent(row.location)}`,
          },
        ]
      : [],
  )
  if (otherLocationCount > 0) {
    locations.push({ label: "Other places", count: otherLocationCount })
  }
  if (unknownLocationCount > 0) {
    locations.push({ label: "No location", count: unknownLocationCount })
  }

  const topSourceTotal = topSources.reduce(
    (sum, row) => sum + row._count._all,
    0,
  )
  const otherSourceCount = Math.max(0, total - topSourceTotal)
  const sources: OverviewBreakdownItem[] = topSources.map((row) => ({
    label: row.source,
    count: row._count._all,
    href: `/leads?source=${encodeURIComponent(row.source)}`,
  }))
  if (otherSourceCount > 0) {
    sources.push({ label: "Other sources", count: otherSourceCount })
  }

  return {
    total,
    addedThisMonth,
    addedLastMonth,
    locationCount: toCount(locationCountRows[0]?.count ?? 0),
    monthLabel: format(thisMonthStart, "MMMM"),
    locations,
    sources,
    recent: recent.map((lead) => ({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      location: lead.location,
      source: lead.source,
      addedLabel: formatDistanceToNow(lead.createdAt, { addSuffix: true }),
    })),
    invalidMobileCount,
  }
}
