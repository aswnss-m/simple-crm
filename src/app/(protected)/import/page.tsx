import { FileSpreadsheet, Clock3 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { headers } from "next/headers"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { ImportForm } from "./import-form"
import { redirect } from "next/navigation"

export default async function ImportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) return redirect('/login');

  const [recentImports, tags] =
     await Promise.all([
        prisma.import.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        prisma.tag.findMany({
          where: { userId: session.user.id },
          orderBy: { title: "asc" },
          select: { id: true, title: true, color: true },
        }),
      ])


  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Import contacts"
        description="Import contacts from a CSV file."
      />

      <ImportForm tags={tags} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent imports</CardTitle>
          <CardDescription>
            Your latest contact import activity.
          </CardDescription>
          <CardAction>
            <Clock3 className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>

        <CardContent>
          {recentImports.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {recentImports.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">
                      {item.successCount} imported
                    </Badge>
                    {item.errorCount > 0 ? (
                      <Badge variant="destructive">
                        {item.errorCount} skipped
                      </Badge>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <FileSpreadsheet className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No imports yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your completed imports will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
