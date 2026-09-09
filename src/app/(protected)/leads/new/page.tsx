import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { NewLeadForm } from "./new-lead-form"

export default async function NewLeadPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return redirect("/login")

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true, color: true },
  })

  return <NewLeadForm tags={tags} />
}
