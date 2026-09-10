import { Clock3, FileDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { exportFilterLabel } from "@/lib/export-csv"
import { cn } from "@/lib/utils"
import type { ExportListItem } from "@/types/export"

const countFormat = new Intl.NumberFormat("en-IN")

export function ExportHistory({ exports }: { exports: ExportListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent batches</CardTitle>
        <CardDescription>
          When each file was downloaded, and which filters it used.
        </CardDescription>
        <CardAction>
          <Clock3 className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {exports.length > 0 ? (
          <div className="divide-y rounded-lg border">
            {exports.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/export/${item.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {item.fileName ?? "Export batch"}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                    {" · "}
                    {exportFilterLabel(item.filters)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">
                    {countFormat.format(item.leadCount)} numbers
                  </Badge>
                  <Link
                    href={`/export/${item.id}/download`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    <FileDown />
                    Download
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <FileDown className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No exports yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed batches will show up here with the time and filters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
