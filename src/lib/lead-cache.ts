import { revalidatePath, revalidateTag } from "next/cache"

export function leadCacheTag(userId: string) {
  return `leads:${userId}`
}

export function revalidateLeadData(userId: string, leadId?: string) {
  revalidateTag(leadCacheTag(userId), "max")
  revalidatePath("/leads")
  revalidatePath("/tags")
  revalidatePath("/import")
  revalidatePath("/export")
  revalidatePath("/overview")
  if (leadId) revalidatePath(`/leads/${leadId}`)
}
