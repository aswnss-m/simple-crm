"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ContactRound, Plus, Upload } from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { isNumericMobile } from "@/lib/phone-location"

import type {
  OverviewBreakdownItem,
  OverviewData,
} from "./overview-types"

const countFormat = new Intl.NumberFormat("en-IN")

function formatCount(value: number) {
  return countFormat.format(value)
}

function formatIndianScale(value: number) {
  if (value >= 1_00_00_000) {
    const crore = value / 1_00_00_000
    return `${Number(crore.toFixed(crore >= 10 ? 1 : 2))} crore`
  }
  if (value >= 1_00_000) {
    const lakh = value / 1_00_000
    return `${Number(lakh.toFixed(lakh >= 10 ? 1 : 2))} lakh`
  }
  return null
}

function monthDeltaLabel(thisMonth: number, lastMonth: number, monthLabel: string) {
  if (lastMonth === 0) {
    return thisMonth === 0
      ? `No new contacts in ${monthLabel}`
      : `First ${formatCount(thisMonth)} this month`
  }

  const delta = thisMonth - lastMonth
  if (delta === 0) return `Same as last month`
  if (delta > 0) {
    return `${formatCount(delta)} more than last month`
  }
  return `${formatCount(Math.abs(delta))} fewer than last month`
}

function BreakdownList({
  items,
  total,
  emptyLabel,
}: {
  items: OverviewBreakdownItem[]
  total: number
  emptyLabel: string
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
        <p className="text-sm font-medium">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const pct = total === 0 ? 0 : Math.round((item.count / total) * 100)
        const content = (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatCount(item.count)} ({pct}%)
              </span>
            </div>
            <Progress
              value={pct}
              className="w-full gap-0"
              aria-label={`${item.label}, ${pct} percent`}
            />
          </>
        )

        return (
          <li key={item.label}>
            {item.href ? (
              <Link
                href={item.href}
                className="block rounded-md px-1 py-1.5 hover:bg-muted/60"
              >
                {content}
              </Link>
            ) : (
              <div className="px-1 py-1.5">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function OverviewView({ data }: { data: OverviewData }) {
  const router = useRouter()
  const scale = formatIndianScale(data.total)

  if (data.total === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <ContactRound className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add one by hand, or import a CSV.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/leads/new" className={buttonVariants({ size: "sm" })}>
                <Plus />
                New contact
              </Link>
              <Link
                href="/import"
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                <Upload />
                Import CSV
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {data.invalidMobileCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {data.invalidMobileCount === 1
                ? "1 contact has text in the mobile field"
                : `${formatCount(data.invalidMobileCount)} contacts have text in the mobile field`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Leftover from an old CSV import. They will not go out in exports
              until the number is fixed.
            </p>
          </div>
          <Link
            href="/leads?mobile=invalid"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Review
          </Link>
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total contacts</CardDescription>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatCount(data.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {scale ? `${scale} contacts` : "Everyone in your workspace"}
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>Added in {data.monthLabel}</CardDescription>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatCount(data.addedThisMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {monthDeltaLabel(
                data.addedThisMonth,
                data.addedLastMonth,
                data.monthLabel,
              )}
            </p>
          </CardContent>
        </Card>

        <Card size="sm" className="sm:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardDescription>Places</CardDescription>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatCount(data.locationCount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.locationCount === 0
                ? "No locations recorded yet"
                : "Distinct locations on file"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakup</CardTitle>
            <CardDescription>
              Top places and sources. Open a row to filter the full list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="location">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="source">Source</TabsTrigger>
              </TabsList>
              <TabsContent value="location" className="pt-4">
                <BreakdownList
                  items={data.locations}
                  total={data.total}
                  emptyLabel="No locations recorded"
                />
              </TabsContent>
              <TabsContent value="source" className="pt-4">
                <BreakdownList
                  items={data.sources}
                  total={data.total}
                  emptyLabel="No sources recorded"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent contacts</CardTitle>
            <CardDescription>
              Newest people in the workspace.
            </CardDescription>
            <CardAction>
              <Link
                href="/leads"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View all
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums",
                          !isNumericMobile(lead.mobile) && "text-destructive",
                        )}
                      >
                        {lead.mobile}
                      </TableCell>
                      <TableCell className="max-w-36 truncate">
                        {lead.location ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="max-w-36 truncate font-normal"
                        >
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.addedLabel}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
