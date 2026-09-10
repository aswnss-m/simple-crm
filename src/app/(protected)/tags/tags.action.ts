"use server"

import { prisma } from "@/lib/prisma"
import { revalidateLeadData } from "@/lib/lead-cache"
import { getSession } from "@/lib/session"
import { trycatch } from "@/lib/utils"
import {
  createTagSchema,
  deleteTagSchema,
  updateTagSchema,
  type TagActionResult,
} from "@/types/tag"

async function getUserId() {
  const session = await getSession()
  return session?.user.id ?? null
}

function uniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  )
}

export async function createTag(input: unknown): Promise<TagActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to manage tags." }
  }

  const parsed = createTagSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That tag is invalid.",
    }
  }

  const [created, error] = await trycatch(() =>
    prisma.tag.create({
      data: {
        title: parsed.data.title,
        color: parsed.data.color,
        userId,
      },
    }),
  )

  if (error || !created) {
    return {
      ok: false,
      error: uniqueError(error)
        ? "A tag with that name already exists."
        : "Could not create that tag.",
    }
  }

  revalidateLeadData(userId)
  return { ok: true }
}

export async function updateTag(input: unknown): Promise<TagActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to manage tags." }
  }

  const parsed = updateTagSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "That tag is invalid.",
    }
  }

  const existing = await prisma.tag.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  })

  if (!existing) {
    return { ok: false, error: "That tag could not be found." }
  }

  const [updated, error] = await trycatch(() =>
    prisma.tag.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        color: parsed.data.color,
      },
    }),
  )

  if (error || !updated) {
    return {
      ok: false,
      error: uniqueError(error)
        ? "A tag with that name already exists."
        : "Could not update that tag.",
    }
  }

  revalidateLeadData(userId)
  return { ok: true }
}

export async function deleteTag(input: unknown): Promise<TagActionResult> {
  const userId = await getUserId()
  if (!userId) {
    return { ok: false, error: "You need to be signed in to manage tags." }
  }

  const parsed = deleteTagSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "That tag could not be found." }
  }

  const existing = await prisma.tag.findFirst({
    where: { id: parsed.data.id, userId },
    select: { id: true },
  })

  if (!existing) {
    return { ok: false, error: "That tag could not be found." }
  }

  const [, error] = await trycatch(() =>
    prisma.tag.delete({
      where: { id: parsed.data.id },
    }),
  )

  if (error) {
    return { ok: false, error: "Could not delete that tag." }
  }

  revalidateLeadData(userId)
  return { ok: true }
}
