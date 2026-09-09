"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import {
  normalizeHex,
  TAG_COLORS,
  type TagWithCount,
} from "@/types/tag"

import { createTag, deleteTag, updateTag } from "./tags.action"

function isIncompleteHex(value: string) {
  const hex = value.trim().replace(/^#/, "")
  return (
    hex.length > 0 &&
    hex.length < 6 &&
    hex.length !== 3 &&
    /^[0-9a-fA-F]*$/.test(hex)
  )
}

export function TagsManager({ tags }: { tags: TagWithCount[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [editor, setEditor] = useState<TagWithCount | "new" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null)
  const [title, setTitle] = useState("")
  const [color, setColor] = useState<string>(TAG_COLORS[0])
  const parsedColor = normalizeHex(color)
  const filteredTags = useMemo(() => {
    const nextQuery = query.trim().toLowerCase()
    if (!nextQuery) return tags
    return tags.filter((tag) => tag.title.toLowerCase().includes(nextQuery))
  }, [query, tags])
  const hexInvalid =
    color.trim().length > 0 && parsedColor === null && !isIncompleteHex(color)

  function openCreate() {
    setTitle("")
    setColor(TAG_COLORS[0])
    setEditor("new")
  }

  function openEdit(tag: TagWithCount) {
    setTitle(tag.title)
    setColor(tag.color)
    setEditor(tag)
  }

  function saveTag() {
    const nextTitle = title.trim()
    const nextColor = normalizeHex(color)
    if (!nextTitle) {
      toast.error("Add a tag name.")
      return
    }
    if (!nextColor) {
      toast.error("Use a hex color like #6366f1.")
      return
    }

    startTransition(async () => {
      const result =
        editor === "new"
          ? await createTag({ title: nextTitle, color: nextColor })
          : editor
            ? await updateTag({ id: editor.id, title: nextTitle, color: nextColor })
            : { ok: false as const, error: "That tag could not be found." }

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(editor === "new" ? "Tag created." : "Tag updated.")
      setEditor(null)
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deleteTag({ id: deleteTarget.id })
      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success("Tag deleted.")
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Tags"
        description="Create labels with a name and color, then apply them in bulk when you import contacts."
      >
        <Button type="button" onClick={openCreate}>
          <Plus />
          New tag
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your tags</CardTitle>
          <CardDescription>
            These show up in the import dialog so you can apply them to a whole
            file at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tags.length > 0 ? (
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tags"
                autoComplete="off"
                aria-label="Search tags"
              />
              {query.trim().length > 0 ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
          ) : null}

          {tags.length > 0 ? (
            filteredTags.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{tag.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {tag.leadCount}{" "}
                          {tag.leadCount === 1 ? "contact" : "contacts"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(tag)}
                        disabled={isPending}
                        aria-label={`Edit ${tag.title}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(tag)}
                        disabled={isPending}
                        aria-label={`Delete ${tag.title}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <Search className="mb-3 size-6 text-muted-foreground" />
                <p className="text-sm font-medium">No matching tags</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing matches “{query.trim()}”.
                </p>
              </div>
            )
          ) : (
            <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Tag className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No tags yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a tag here, or add one while importing contacts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!isPending && !open) setEditor(null)
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>
              {editor === "new" ? "New tag" : "Edit tag"}
            </DialogTitle>
            <DialogDescription>
              Each tag only needs a name and a color.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tag-title">Name</FieldLabel>
              <Input
                id="tag-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="VIP, follow-up, hot lead…"
                disabled={isPending}
                autoComplete="off"
              />
            </Field>
            <Field data-invalid={hexInvalid || undefined}>
              <FieldLabel>Color</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    disabled={isPending}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      "size-7 rounded-full ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring/50",
                      parsedColor === swatch
                        ? "ring-2 ring-ring ring-offset-2"
                        : "hover:ring-2 hover:ring-ring/40",
                    )}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Use color ${swatch}`}
                    aria-pressed={parsedColor === swatch}
                  />
                ))}
              </div>
              <FieldLabel htmlFor="tag-hex">Hex</FieldLabel>
              <InputGroup data-invalid={hexInvalid || undefined}>
                <InputGroupAddon>
                  <span
                    className="size-4 rounded-full border border-border"
                    style={{ backgroundColor: parsedColor ?? "#00000000" }}
                  />
                </InputGroupAddon>
                <InputGroupInput
                  id="tag-hex"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="#6366f1"
                  disabled={isPending}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={hexInvalid}
                  className="font-mono"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>HEX</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {hexInvalid ? (
                <FieldError>Use a hex color like #6366f1 or #fff.</FieldError>
              ) : (
                <FieldDescription>
                  Type a 3 or 6 digit hex code, with or without #.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditor(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveTag}
              disabled={isPending || title.trim().length === 0 || !parsedColor}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              {editor === "new" ? "Create tag" : "Save tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!isPending && !open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Delete tag</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                deleteTarget.leadCount > 0 ? (
                  <>
                    Remove <span className="font-medium">{deleteTarget.title}</span>{" "}
                    from {deleteTarget.leadCount}{" "}
                    {deleteTarget.leadCount === 1 ? "contact" : "contacts"}? The
                    contacts stay in your CRM.
                  </>
                ) : (
                  <>
                    Delete <span className="font-medium">{deleteTarget.title}</span>?
                    This cannot be undone.
                  </>
                )
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Delete tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
