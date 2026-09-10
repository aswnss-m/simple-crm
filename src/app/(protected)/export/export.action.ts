"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { buildExportFileName } from "@/lib/export-csv"
import { prisma } from "@/lib/prisma"
import { trycatch } from "@/lib/utils"
import {
  exportInputSchema,
  EXPORT_PREVIEW_ROWS,
  type ExportActionResult,
  type ExportPreviewResult,
} from "@/types/export"

import {
  computeExportPreview,
  exportBaseWhere,
  exportLeadOrderBy,
  exportLeadSelect,
  exportSelectWhere,
} from "./export-query"

async function getUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user.id ?? null
}

function revalidateExportPaths() {
  revalidatePath("/export")
  revalidatePath("/leads")
  revalidatePath("/overview")
}

export async function previewExport(input: unknown): Promise<ExportPreviewResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to export contacts." }
  }

  const parsed = exportInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export filters." }
  }

  const filters = parsed.data
  const baseWhere = exportBaseWhere(userId, filters)

  const [matching, neverExported, samples] = await Promise.all([
    prisma.lead.count({ where: baseWhere }),
    prisma.lead.count({ where: { ...baseWhere, lastExportedAt: null } }),
    prisma.lead.findMany({
      where: exportSelectWhere(userId, filters),
      orderBy: exportLeadOrderBy,
      take: EXPORT_PREVIEW_ROWS,
      select: exportLeadSelect,
    }),
  ])

  return {
    ok: true,
    preview: computeExportPreview(matching, neverExported, filters),
    samples,
  }
}

export async function createExport(input: unknown): Promise<ExportActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to export contacts." }
  }

  const parsed = exportInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export filters." }
  }

  const filters = parsed.data

  const [result, error] = await trycatch(() =>
    prisma.$transaction(
      async (tx) => {
        const leads = await tx.lead.findMany({
          where: exportSelectWhere(userId, filters),
          orderBy: exportLeadOrderBy,
          take: filters.limit,
          select: {
            id: true,
            lastExportedAt: true,
          },
        })

        if (leads.length === 0) {
          return { empty: true as const }
        }

        const now = new Date()
        const fileName = buildExportFileName(filters, leads.length, now)
        const previouslyExportedCount = leads.filter((lead) => lead.lastExportedAt).length

        const record = await tx.export.create({
          data: {
            userId,
            leadCount: leads.length,
            fileName,
            filters,
          },
        })

        await tx.exportItem.createMany({
          data: leads.map((lead) => ({
            exportId: record.id,
            leadId: lead.id,
          })),
        })

        await tx.lead.updateMany({
          where: { id: { in: leads.map((lead) => lead.id) }, userId },
          data: {
            lastExportedAt: now,
            exportCount: { increment: 1 },
          },
        })

        return {
          empty: false as const,
          id: record.id,
          fileName,
          leadCount: leads.length,
          previouslyExportedCount,
        }
      },
      { timeout: 60_000 },
    ),
  )

  if (error || !result) {
    return { ok: false, error: "Could not export contacts. Please try again." }
  }

  if (result.empty) {
    return {
      ok: false,
      error: filters.includePreviouslyExported
        ? "No contacts match these filters."
        : "No new numbers to export. Turn on Export again to include numbers from earlier batches.",
    }
  }

  revalidateExportPaths()

  return {
    ok: true,
    id: result.id,
    fileName: result.fileName,
    leadCount: result.leadCount,
    previouslyExportedCount: result.previouslyExportedCount,
  }
}
