import { redirect } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { prisma } from "@/lib/prisma"
import { listInvalidMobileIds } from "@/lib/mobile-query"
import { getSession } from "@/lib/session"
import {
  DEFAULT_EXPORT_FILTERS,
  EXPORT_PREVIEW_ROWS,
  parseStoredExportFilters,
} from "@/types/export"

import { ExportForm } from "./export-form"
import { ExportHistory } from "./export-history"
import {
  computeExportPreview,
  exportBaseWhere,
  exportLeadOrderBy,
  exportLeadSelect,
  exportSelectWhere,
} from "./export-query"

export const maxDuration = 60

export default async function ExportPage() {
  const session = await getSession()

  if (!session) return redirect("/login")

  const userId = session.user.id
  const filters = DEFAULT_EXPORT_FILTERS
  const invalidIds = await listInvalidMobileIds(userId)
  const baseWhere = exportBaseWhere(userId, filters, invalidIds)

  const [matching, neverExported, samples, sources, locations, tags, recentExports] =
    await Promise.all([
      prisma.lead.count({ where: baseWhere }),
      prisma.lead.count({ where: { ...baseWhere, lastExportedAt: null } }),
      prisma.lead.findMany({
        where: exportSelectWhere(userId, filters, invalidIds),
        orderBy: exportLeadOrderBy,
        take: EXPORT_PREVIEW_ROWS,
        select: exportLeadSelect,
      }),
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
      prisma.export.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          fileName: true,
          leadCount: true,
          createdAt: true,
          filters: true,
        },
      }),
    ])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Export numbers"
        description="Download unique phone lists in 10,000-number batches. New imports stay available until you export them."
      />

      <ExportForm
        sources={sources.map((item) => item.source)}
        locations={locations.flatMap((item) =>
          item.location ? [item.location] : [],
        )}
        tags={tags}
        initialFilters={filters}
        initialPreview={computeExportPreview(matching, neverExported, filters)}
        initialSamples={samples}
      />

      <ExportHistory
        tags={tags}
        exports={recentExports.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          leadCount: item.leadCount,
          createdAt: item.createdAt.toISOString(),
          filters: parseStoredExportFilters(item.filters),
        }))}
      />
    </div>
  )
}
