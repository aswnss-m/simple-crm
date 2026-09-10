import { redirect } from "next/navigation"

import { getSession } from "@/lib/session"

import { loadOverview } from "./overview-data"
import { OverviewView } from "./overview-view"

export async function OverviewBody() {
  const session = await getSession()

  if (!session) return redirect("/login")

  const data = await loadOverview(session.user.id)
  return <OverviewView data={data} />
}
