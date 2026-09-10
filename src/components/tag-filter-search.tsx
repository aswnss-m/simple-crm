"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldDescription } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { Tag } from "@/types/tag"

const COLLAPSED_TAG_COUNT = 8

export function TagFilterSearch({
  id,
  tags,
  selected = [],
  onChange,
  disabled,
}: {
  id?: string
  tags: Tag[]
  selected?: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState("")
  const [expanded, setExpanded] = useState(false)
  const query = draft.trim().toLowerCase()
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedSet.has(tag.id)),
    [selectedSet, tags],
  )
  const unused = useMemo(
    () => tags.filter((tag) => !selectedSet.has(tag.id)),
    [selectedSet, tags],
  )
  const matching = useMemo(
    () =>
      query
        ? unused.filter((tag) => tag.title.toLowerCase().includes(query))
        : unused,
    [query, unused],
  )
  const visible = expanded || query ? matching : matching.slice(0, COLLAPSED_TAG_COUNT)
  const hiddenCount = matching.length - visible.length
  const exactMatch = matching.find(
    (tag) => tag.title.toLowerCase() === query,
  )

  function add(id: number, keepDraft = false) {
    if (selectedSet.has(id)) return
    onChange([...selected, id])
    if (!keepDraft) setDraft("")
  }

  function remove(id: number) {
    onChange(selected.filter((tagId) => tagId !== id))
  }

  function commitDraft() {
    const next = exactMatch ?? matching[0]
    if (!next || matching.length === 0) return
    if (!exactMatch && matching.length > 1) return
    add(next.id)
  }

  if (tags.length === 0) {
    return (
      <FieldDescription>No tags yet. Create some on the Tags page.</FieldDescription>
    )
  }

  return (
    <div className="space-y-1.5">
      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="pr-0.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.title}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => remove(tag.id)}
                disabled={disabled}
                aria-label={`Remove ${tag.title}`}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <InputGroup
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            event.stopPropagation()
            commitDraft()
          }
        }}
      >
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search tags"
          disabled={disabled}
          autoComplete="off"
        />
        {draft.length > 0 ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear tag search"
              disabled={disabled}
              onClick={() => setDraft("")}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      {query && matching.length === 0 ? (
        <FieldDescription>No tags match “{draft.trim()}”.</FieldDescription>
      ) : unused.length > 0 ? (
        <div className="flex max-h-32 flex-wrap items-center gap-1.5 overflow-y-auto">
          {visible.map((tag) => (
            <Button
              key={tag.id}
              type="button"
              variant="outline"
              size="xs"
              disabled={disabled}
              onClick={() => add(tag.id, true)}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.title}
            </Button>
          ))}
          {hiddenCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={disabled}
              onClick={() => setExpanded(true)}
            >
              +{hiddenCount} more
            </Button>
          ) : null}
          {expanded && matching.length > COLLAPSED_TAG_COUNT && !query ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={disabled}
              onClick={() => setExpanded(false)}
            >
              Show less
            </Button>
          ) : null}
        </div>
      ) : selectedTags.length > 0 ? (
        <FieldDescription>Every tag is selected.</FieldDescription>
      ) : null}

      <FieldDescription>
        {selectedTags.length > 1
          ? "Contacts with any of these tags."
          : "Search and pick one or more tags."}
      </FieldDescription>
    </div>
  )
}
