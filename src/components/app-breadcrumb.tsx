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

export function AppBreadcrumb() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1

          const href =
            "/" + segments.slice(0, index + 1).join("/")

          const isIdLike = segment.length > 16 && !segment.includes("-")
          const label = isIdLike
            ? "Lead"
            : segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase())

          return (
            <React.Fragment key={href}>
              {index > 0 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}

              <BreadcrumbItem
                className={!isLast ? "hidden md:block" : ""}
              >
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
