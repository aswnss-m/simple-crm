import { z } from "zod"

export const TAG_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
] as const

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function normalizeHex(value: string) {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`

  if (!HEX_COLOR_RE.test(withHash)) return null

  const hex = withHash.slice(1).toLowerCase()
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }

  return `#${hex}`
}

export const tagColorSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const next = normalizeHex(value)
    if (!next) {
      ctx.addIssue({
        code: "custom",
        message: "Use a hex color like #6366f1.",
      })
      return z.NEVER
    }
    return next
  })

export const tagFieldsSchema = z.object({
  title: z.string().trim().min(1).max(50),
  color: tagColorSchema,
})

export const createTagSchema = tagFieldsSchema

export const updateTagSchema = tagFieldsSchema.extend({
  id: z.number().int(),
})

export const deleteTagSchema = z.object({
  id: z.number().int(),
})

export type TagColor = (typeof TAG_COLORS)[number]

export type Tag = {
  id: number
  title: string
  color: string
}

export type TagWithCount = Tag & {
  leadCount: number
}

export type TagActionResult =
  | { ok: true }
  | { ok: false; error: string }
