import { z } from "zod"

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Add a name.").max(80),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Confirm the new password."),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Choose a password that is different from the current one.",
  })

export type UpdateName = z.infer<typeof updateNameSchema>
export type ChangePassword = z.infer<typeof changePasswordSchema>
