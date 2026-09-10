"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import * as React from "react"

const SEGMENT_LABELS: Record<string, string> = {
  overview: "Overview",
  leads: "Contacts",
  new: "New",
  import: "Import",
  export: "Export",
  tags: "Tags",
  account: "Account",
}

function segmentLabel(segment: string, pathname: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]

  const isIdLike = segment.length > 16 && !segment.includes("-")
  if (isIdLike) {
    return pathname.startsWith("/export") ? "Batch" : "Contact"
  }

  return segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = "/" + segments.slice(0, index + 1).join("/")
          const label = segmentLabel(segment, pathname)

          return (
            <React.Fragment key={href}>
              {index > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}

              <BreadcrumbItem className={!isLast ? "hidden md:block" : ""}>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
