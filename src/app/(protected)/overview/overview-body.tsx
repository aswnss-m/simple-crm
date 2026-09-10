import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import { loadOverview } from "./overview-data"
import { OverviewView } from "./overview-view"

export async function OverviewBody() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return redirect("/login")

  const data = await loadOverview(session.user.id)
  return <OverviewView data={data} />
}
