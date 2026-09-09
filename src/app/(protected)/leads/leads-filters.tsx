"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ListFilter, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldLabel } from "@/components/ui/field"
import type { LeadListQuery } from "@/types/lead"

import { leadListHref } from "./leads-query"

const SEARCH_DELAY_MS = 400

export function LeadsFilters({
  query,
  sources,
  locations,
}: {
  query: LeadListQuery
  sources: string[]
  locations: string[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState(query.q ?? "")
  const pendingSearch = (search.trim() || undefined) !== (query.q || undefined)
  const filterCount = [
    query.source,
    query.location,
    query.exported,
    query.origin,
  ].filter(Boolean).length

  function go(next: Partial<LeadListQuery>) {
    router.replace(
      leadListHref({
        ...query,
        q: search.trim() || undefined,
        ...next,
        page: 1,
      }),
    )
  }

  useEffect(() => {
    setSearch(query.q ?? "")
  }, [query.q])

  useEffect(() => {
    const nextQuery = search.trim() || undefined
    if (nextQuery === (query.q || undefined)) return

    const timer = window.setTimeout(() => {
      router.replace(
        leadListHref({
          ...query,
          q: nextQuery,
          page: 1,
        }),
      )
    }, SEARCH_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [query, router, search])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Field className="min-w-0 flex-1">
        <FieldLabel htmlFor="leads-search">Search</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            {pendingSearch ? <Spinner /> : <Search />}
          </InputGroupAddon>
          <InputGroupInput
            id="leads-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or mobile"
            autoComplete="off"
          />
          {search.length > 0 ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("")
                  go({ q: undefined })
                }}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </Field>

      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="shrink-0" />}>
          <ListFilter />
          Filters
          {filterCount > 0 ? (
            <Badge variant="secondary">{filterCount}</Badge>
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 gap-3">
          <PopoverHeader>
            <PopoverTitle>Filters</PopoverTitle>
          </PopoverHeader>

          <Field>
            <FieldLabel>Source</FieldLabel>
            <Select
              value={query.source ?? "all"}
              onValueChange={(value) =>
                go({
                  source: value === "all" ? undefined : String(value),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Location</FieldLabel>
            <Select
              value={query.location ?? "all"}
              onValueChange={(value) =>
                go({
                  location: value === "all" ? undefined : String(value),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Export</FieldLabel>
            <Select
              value={query.exported ?? "all"}
              onValueChange={(value) =>
                go({
                  exported:
                    value === "never" || value === "yes" ? value : undefined,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any export status" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">Any export status</SelectItem>
                <SelectItem value="never">Never exported</SelectItem>
                <SelectItem value="yes">Exported</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Origin</FieldLabel>
            <Select
              value={query.origin ?? "all"}
              onValueChange={(value) =>
                go({
                  origin:
                    value === "imported" || value === "manual"
                      ? value
                      : undefined,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any origin" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger>
                <SelectItem value="all">Any origin</SelectItem>
                <SelectItem value="imported">Imported</SelectItem>
                <SelectItem value="manual">Added manually</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {filterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-end"
              onClick={() =>
                go({
                  source: undefined,
                  location: undefined,
                  exported: undefined,
                  origin: undefined,
                })
              }
            >
              Clear filters
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
