import { z } from "zod"

import type { Tag } from "./tag"

export const leadFieldsSchema = z.object({
  name: z.string().trim().min(1, "Add a name.").max(200),
  mobile: z.string().trim().min(1, "Add a mobile number.").max(50),
  email: z
    .union([z.email("Enter a valid email.").max(320), z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || undefined),
  source: z.string().trim().min(1, "Add a source.").max(200),
  notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((value) => value || undefined),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
})

export const createLeadSchema = leadFieldsSchema

export const updateLeadSchema = leadFieldsSchema.extend({
  id: z.string().trim().min(1),
})

export const deleteLeadSchema = z.object({
  id: z.string().trim().min(1),
})

export type LeadFields = z.infer<typeof leadFieldsSchema>

export type LeadListItem = {
  id: string
  name: string
  mobile: string
  email: string | null
  location: string | null
  source: string
  createdAt: string
  tags: Tag[]
}

export type LeadDetail = LeadListItem & {
  notes: string | null
  lastExportedAt: string | null
  importFileName: string | null
}

export type LeadActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export const LEADS_PAGE_SIZE = 20

const emptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)

export const leadListQuerySchema = z.object({
  q: emptyString,
  source: emptyString,
  location: emptyString,
  exported: z
    .string()
    .optional()
    .transform((value) =>
      value === "never" || value === "yes" ? value : undefined,
    ),
  origin: z
    .string()
    .optional()
    .transform((value) =>
      value === "imported" || value === "manual" ? value : undefined,
    ),
  page: z.coerce.number().int().min(1).catch(1),
})

export type LeadListQuery = z.infer<typeof leadListQuerySchema>
