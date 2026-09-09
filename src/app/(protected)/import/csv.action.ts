"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trycatch } from "@/lib/utils"
import {
  importCsvSchema,
  TAG_COLORS,
  type ImportCsvResult,
} from "@/types/csv"

export async function importCsv(input: unknown): Promise<ImportCsvResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return { ok: false, error: "You need to be signed in to import contacts." }
  }

  const parsed = importCsvSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "The import data is invalid.",
    }
  }

  const { fileName, source, tags, rows } = parsed.data
  const userId = session.user.id
  const tagTitles = [
    ...new Set(tags.map((title) => title.trim()).filter(Boolean)),
  ]

  const [result, error] = await trycatch(() =>
    prisma.$transaction(
      async (tx) => {
        const record = await tx.import.create({
          data: {
            userId,
            fileName,
            source,
            successCount: 0,
            errorCount: 0,
          },
        })

        // this will insert max 5000 records which is way below the max limit of postgress ( 65,535 / 7 = 9,362.1428571429)
        const created = await tx.lead.createMany({
          data: rows.map((row) => ({
            name: row.name,
            mobile: row.mobile,
            email: row.email,
            location: row.location,
            source,
            userId,
            importId: record.id,
          })),
          skipDuplicates: true,
        })

        const successCount = created.count
        const duplicateCount = rows.length - successCount

        if (tagTitles.length > 0) {
          const existingTags = await tx.tag.findMany({
            where: { userId },
            select: { id: true, title: true },
          })
          const tagsByTitle = new Map(
            existingTags.map((tag) => [tag.title.toLowerCase(), tag]),
          )

          const tagIds: number[] = []
          for (const [index, title] of tagTitles.entries()) {
            const match = tagsByTitle.get(title.toLowerCase())
            if (match) {
              tagIds.push(match.id)
              continue
            }

            const tag = await tx.tag.create({
              data: {
                title,
                color: TAG_COLORS[index % TAG_COLORS.length],
                userId,
              },
            })
            tagIds.push(tag.id)
            tagsByTitle.set(title.toLowerCase(), tag)
          }

          if (successCount > 0 && tagIds.length > 0) {
            const importedLeads = await tx.lead.findMany({
              where: { importId: record.id },
              select: { id: true },
            })

            if (importedLeads.length > 0) {
              await Promise.all(
                tagIds.map((tagId) =>
                  tx.tag.update({
                    where: { id: tagId },
                    data: {
                      leads: {
                        connect: importedLeads.map((lead) => ({ id: lead.id })),
                      },
                    },
                  }),
                ),
              )
            }
          }
        }

        await tx.import.update({
          where: { id: record.id },
          data: {
            successCount,
            errorCount: duplicateCount,
          },
        })

        return {
          importId: record.id,
          successCount,
          duplicateCount,
        }
      },
      { timeout: 30_000 },
    ),
  )

  if (error || !result) {
    return { ok: false, error: "Could not import contacts. Please try again." }
  }

  revalidatePath("/import")
  revalidatePath("/tags")

  return {
    ok: true,
    importId: result.importId,
    successCount: result.successCount,
    errorCount: result.duplicateCount,
    duplicateCount: result.duplicateCount,
  }
}
