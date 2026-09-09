"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Plus, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import type { Tag } from "@/types/tag"

export type LeadFormValues = {
  name: string
  mobile: string
  email: string
  location: string
  source: string
  notes: string
  tags: string[]
}

export function LeadForm({
  tags,
  values,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
  extraActions,
}: {
  tags: Tag[]
  values: LeadFormValues
  onChange: (values: LeadFormValues) => void
  onSubmit: () => void
  isPending: boolean
  submitLabel: string
  extraActions?: ReactNode
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  function patch(patch: Partial<LeadFormValues>) {
    onChange({ ...values, ...patch })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="lead-name">Name</FieldLabel>
            <Input
              id="lead-name"
              value={values.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="Jane Doe"
              disabled={isPending}
              autoComplete="name"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-mobile">Mobile</FieldLabel>
            <Input
              id="lead-mobile"
              value={values.mobile}
              onChange={(event) => patch({ mobile: event.target.value })}
              placeholder="5551234567"
              disabled={isPending}
              autoComplete="tel"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-email">Email</FieldLabel>
            <Input
              id="lead-email"
              type="email"
              value={values.email}
              onChange={(event) => patch({ email: event.target.value })}
              placeholder="jane@example.com"
              disabled={isPending}
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lead-location">Location</FieldLabel>
            <Input
              id="lead-location"
              value={values.location}
              onChange={(event) => patch({ location: event.target.value })}
              placeholder="Austin"
              disabled={isPending}
              autoComplete="off"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="lead-source">Source</FieldLabel>
          <Input
            id="lead-source"
            value={values.source}
            onChange={(event) => patch({ source: event.target.value })}
            placeholder="Website, referral, campaign…"
            disabled={isPending}
            autoComplete="off"
            required
          />
          <FieldDescription>Where this contact came from.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
          <Textarea
            id="lead-notes"
            value={values.notes}
            onChange={(event) => patch({ notes: event.target.value })}
            placeholder="Anything useful to remember…"
            disabled={isPending}
          />
        </Field>

        <TagPicker
          tags={tags}
          selected={values.tags}
          disabled={isPending}
          onChange={(next) => patch({ tags: next })}
        />
      </FieldGroup>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {extraActions}
        <Button type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

const COLLAPSED_TAG_COUNT = 8

function TagPicker({
  tags,
  selected,
  disabled,
  onChange,
}: {
  tags: Tag[]
  selected: string[]
  disabled: boolean
  onChange: (tags: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  const [expanded, setExpanded] = useState(false)
  const query = draft.trim().toLowerCase()
  const unused = useMemo(
    () =>
      tags.filter(
        (tag) =>
          !selected.some(
            (title) => tag.title.toLowerCase() === title.toLowerCase(),
          ),
      ),
    [selected, tags],
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
  const canAdd =
    draft.trim().length > 0 &&
    !selected.some((title) => title.toLowerCase() === draft.trim().toLowerCase())

  function add(title: string, keepDraft = false) {
    const next = title.trim()
    if (!next) return
    if (!selected.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      onChange([...selected, next])
    }
    if (!keepDraft) setDraft("")
  }

  function remove(title: string) {
    onChange(selected.filter((tag) => tag.toLowerCase() !== title.toLowerCase()))
  }

  const colorsByTitle = useMemo(
    () => new Map(tags.map((tag) => [tag.title.toLowerCase(), tag.color])),
    [tags],
  )

  return (
    <Field>
      <FieldLabel htmlFor="lead-tags">Tags</FieldLabel>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((title) => (
            <Badge key={title} variant="secondary" className="pr-0.5">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    colorsByTitle.get(title.toLowerCase()) ?? "#6366f1",
                }}
              />
              {title}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => remove(title)}
                disabled={disabled}
                aria-label={`Remove ${title}`}
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
            add(draft)
          }
        }}
      >
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          id="lead-tags"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search or add a tag"
          disabled={disabled}
          autoComplete="off"
        />
        {canAdd ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="xs"
              disabled={disabled}
              onClick={() => add(draft)}
            >
              <Plus />
              Add
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {canAdd &&
      !unused.some((tag) => tag.title.toLowerCase() === draft.trim().toLowerCase()) ? (
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled}
          onClick={() => add(draft)}
        >
          <Plus />
          Create “{draft.trim()}”
        </Button>
      ) : null}
      {unused.length > 0 ? (
        <div className="flex max-h-32 flex-wrap items-center gap-1.5 overflow-y-auto">
          {visible.map((tag) => (
            <Button
              key={tag.id}
              type="button"
              variant="outline"
              size="xs"
              disabled={disabled}
              onClick={() => add(tag.title, true)}
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
      ) : null}
    </Field>
  )
}
