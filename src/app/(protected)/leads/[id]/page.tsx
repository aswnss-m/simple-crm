import { notFound, redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

import { LeadDetail } from "./lead-detail"

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()

  if (!session) return redirect("/login")

  const { id } = await params

  const [lead, tags] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        location: true,
        source: true,
        notes: true,
        createdAt: true,
        lastExportedAt: true,
        exportCount: true,
        import: { select: { fileName: true } },
        tags: {
          select: { id: true, title: true, color: true },
          orderBy: { title: "asc" },
        },
        exportItems: {
          select: {
            export: {
              select: {
                id: true,
                fileName: true,
                createdAt: true,
                leadCount: true,
              },
            },
          },
        },
      },
    }),
    prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, color: true },
    }),
  ])

  if (!lead) notFound()

  return (
    <LeadDetail
      key={lead.id}
      lead={{
        id: lead.id,
        name: lead.name,
        mobile: lead.mobile,
        email: lead.email,
        location: lead.location,
        source: lead.source,
        notes: lead.notes,
        createdAt: lead.createdAt.toISOString(),
        lastExportedAt: lead.lastExportedAt?.toISOString() ?? null,
        importFileName: lead.import?.fileName ?? null,
        exportCount: lead.exportCount,
        exportHistory: [...lead.exportItems]
          .sort(
            (a, b) =>
              b.export.createdAt.getTime() - a.export.createdAt.getTime(),
          )
          .map((item) => ({
            id: item.export.id,
            fileName: item.export.fileName,
            createdAt: item.export.createdAt.toISOString(),
            leadCount: item.export.leadCount,
          })),
        tags: lead.tags,
      }}
      tags={tags}
    />
  )
}
