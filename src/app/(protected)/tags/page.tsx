import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

import { TagsManager } from "./tags-manager"

export default async function TagsPage() {
  const session = await getSession()

  if (!session) return redirect("/login")

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      color: true,
      _count: { select: { leads: true } },
    },
  })

  return (
    <TagsManager
      tags={tags.map((tag) => ({
        id: tag.id,
        title: tag.title,
        color: tag.color,
        leadCount: tag._count.leads,
      }))}
    />
  )
}
