import { NextResponse } from "next/server"

import {
  buildExportFileName,
  exportMimeType,
  leadsToExportFile,
} from "@/lib/export-csv"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import {
  DEFAULT_EXPORT_FILTERS,
  parseStoredExportFilters,
} from "@/types/export"

export const maxDuration = 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const record = await prisma.export.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      fileName: true,
      leadCount: true,
      createdAt: true,
      filters: true,
      items: {
        select: {
          lead: {
            select: {
              id: true,
              name: true,
              mobile: true,
              location: true,
              source: true,
            },
          },
        },
      },
    },
  })

  if (!record) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 })
  }

  const filters =
    parseStoredExportFilters(record.filters) ?? {
      ...DEFAULT_EXPORT_FILTERS,
      limit: DEFAULT_EXPORT_FILTERS.limit,
    }
  const fileName =
    record.fileName ||
    buildExportFileName(filters, record.leadCount, record.createdAt)
  const body = leadsToExportFile(
    record.items.map((item) => item.lead),
    filters.format,
  )

  return new NextResponse(body, {
    headers: {
      "Content-Type": exportMimeType(filters.format),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
