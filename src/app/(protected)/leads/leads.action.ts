"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trycatch } from "@/lib/utils"
import { TAG_COLORS } from "@/types/tag"
import {
  createLeadSchema,
  deleteLeadSchema,
  updateLeadSchema,
  type LeadActionResult,
} from "@/types/lead"

async function getUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user.id ?? null
}

function uniqueError(error: unknown) {
  let current: unknown = error
  for (let i = 0; i < 4 && current && typeof current === "object"; i += 1) {
    if ("code" in current && (current as { code?: string }).code === "P2002") {
      return true
    }
    current = "cause" in current ? (current as { cause?: unknown }).cause : undefined
  }
  return false
}

async function resolveTagIds(
  userId: string,
  titles: string[],
) {
  const tagTitles = [...new Set(titles.map((title) => title.trim()).filter(Boolean))]
  if (tagTitles.length === 0) return []

  const existingTags = await prisma.tag.findMany({
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

    const tag = await prisma.tag.create({
      data: {
        title,
        color: TAG_COLORS[index % TAG_COLORS.length],
        userId,
      },
    })
    tagIds.push(tag.id)
    tagsByTitle.set(title.toLowerCase(), tag)
  }

  return tagIds
}

function revalidateLeadPaths(id?: string) {
  revalidatePath("/leads")
  revalidatePath("/tags")
  revalidatePath("/import")
  if (id) revalidatePath(`/leads/${id}`)
}

export async function createLead(input: unknown): Promise<LeadActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to add a contact." }
  }

  const parsed = createLeadSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That contact is invalid.",
    }
  }

  const { tags, ...data } = parsed.data
  const [created, error] = await trycatch(() =>
    prisma.lead.create({
      data: {
        ...data,
        userId,
      },
      select: { id: true },
    }),
  )

  if (error || !created) {
    return {
      ok: false,
      error: uniqueError(error)
        ? "A contact with that mobile number already exists."
        : "Could not create that contact.",
    }
  }

  const tagIds = await resolveTagIds(userId, tags)
  if (tagIds.length > 0) {
    await prisma.lead.update({
      where: { id: created.id },
      data: {
        tags: { connect: tagIds.map((id) => ({ id })) },
      },
    })
  }

  revalidateLeadPaths(created.id)
  return { ok: true, id: created.id }
}

export async function updateLead(input: unknown): Promise<LeadActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to update a contact." }
  }

  const parsed = updateLeadSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That contact is invalid.",
    }
  }

  const existing = await prisma.lead.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  })

  if (!existing) {
    return { ok: false, error: "That contact could not be found." }
  }

  const { id, tags, ...data } = parsed.data
  const [updated, error] = await trycatch(() =>
    prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        mobile: data.mobile,
        source: data.source,
        email: data.email ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
      },
      select: { id: true },
    }),
  )

  if (error || !updated) {
    return {
      ok: false,
      error: uniqueError(error)
        ? "A contact with that mobile number already exists."
        : "Could not update that contact.",
    }
  }

  const tagIds = await resolveTagIds(userId, tags)
  await prisma.lead.update({
    where: { id },
    data: {
      tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
    },
  })

  revalidateLeadPaths(id)
  return { ok: true, id }
}

export async function deleteLead(input: unknown): Promise<LeadActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to delete a contact." }
  }

  const parsed = deleteLeadSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "That contact could not be found." }
  }

  const existing = await prisma.lead.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  })

  if (!existing) {
    return { ok: false, error: "That contact could not be found." }
  }

  const [, error] = await trycatch(() =>
    prisma.lead.delete({
      where: { id: parsed.data.id },
    }),
  )

  if (error) {
    return { ok: false, error: "Could not delete that contact." }
  }

  revalidateLeadPaths(parsed.data.id)
  return { ok: true, id: parsed.data.id }
}
