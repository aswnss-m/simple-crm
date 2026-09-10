import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PageHeaderSkeleton({
  withAction = false,
}: {
  withAction?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction ? <Skeleton className="h-8 w-28" /> : null}
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeaderSkeleton />
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LeadsPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeaderSkeleton withAction />
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-14 flex-1" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="space-y-2 rounded-lg border p-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
