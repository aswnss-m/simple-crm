import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { TagsManager } from "./tags-manager"

export default async function TagsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

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
