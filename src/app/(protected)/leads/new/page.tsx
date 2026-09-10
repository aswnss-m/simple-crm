import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

import { NewLeadForm } from "./new-lead-form"

export default async function NewLeadPage() {
  const session = await getSession()

  if (!session) return redirect("/login")

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, color: true },
  })

  return <NewLeadForm tags={tags} />
}
