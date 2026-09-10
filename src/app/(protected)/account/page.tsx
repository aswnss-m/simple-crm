import { redirect } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { getSession } from "@/lib/session"

import { AccountSettings } from "./account-settings"

export const metadata = {
  title: "Account",
}

export default async function AccountPage() {
  const session = await getSession()

  if (!session) return redirect("/login")

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Account"
        description="Your profile and password. Email stays locked until a mail provider is connected."
      />
      <AccountSettings user={session.user} />
    </div>
  )
}
