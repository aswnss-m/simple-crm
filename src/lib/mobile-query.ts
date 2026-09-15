import { prisma } from "@/lib/prisma"

export async function listInvalidMobileIds(userId: string) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM lead
    WHERE "userId" = ${userId}
      AND replace(mobile, ' ', '') !~ '^[0-9]+$'
      AND NOT (
        starts_with(replace(mobile, ' ', ''), '+')
        AND substring(replace(mobile, ' ', '') from 2) ~ '^[0-9]+$'
      )
  `
  return rows.map((row) => row.id)
}

export async function countInvalidMobiles(userId: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM lead
    WHERE "userId" = ${userId}
      AND replace(mobile, ' ', '') !~ '^[0-9]+$'
      AND NOT (
        starts_with(replace(mobile, ' ', ''), '+')
        AND substring(replace(mobile, ' ', '') from 2) ~ '^[0-9]+$'
      )
  `
  return Number(rows[0]?.count ?? 0)
}

export async function deleteInvalidMobiles(userId: string) {
  return prisma.$executeRaw`
    DELETE FROM lead
    WHERE "userId" = ${userId}
      AND replace(mobile, ' ', '') !~ '^[0-9]+$'
      AND NOT (
        starts_with(replace(mobile, ' ', ''), '+')
        AND substring(replace(mobile, ' ', '') from 2) ~ '^[0-9]+$'
      )
  `
}
