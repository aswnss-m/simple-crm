"use client"

import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form-nextjs"
import { Activity } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { authClient, type User } from "@/lib/auth-client"
import { changePasswordSchema, updateNameSchema } from "@/types/account"

function fieldErrors(errors: unknown[]) {
  return errors.map((error) =>
    typeof error === "string"
      ? { message: error }
      : error && typeof error === "object" && "message" in error
        ? { message: String((error as { message?: unknown }).message) }
        : undefined,
  )
}

export function AccountSettings({ user }: { user: User }) {
  const router = useRouter()

  const nameForm = useForm({
    defaultValues: {
      name: user.name,
    },
    validators: {
      onSubmit: updateNameSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await authClient.updateUser({
          name: value.name.trim(),
        })
        if (error) {
          return { form: error.message ?? "Could not update your name." }
        }
      },
    },
    onSubmit: async () => {
      toast.success("Name updated.")
      router.refresh()
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
    validators: {
      onSubmit: changePasswordSchema,
      onSubmitAsync: async ({ value }) => {
        const { error } = await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: value.revokeOtherSessions,
        })
        if (error) {
          return {
            form: error.message ?? "Could not change your password.",
          }
        }
      },
    },
    onSubmit: async () => {
      passwordForm.reset()
      toast.success("Password updated.")
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            This name shows in the sidebar. Email stays as-is until a mail
            provider is connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="account-name-form"
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              nameForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <nameForm.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        autoComplete="name"
                        required
                      />
                      <Activity mode={isInvalid ? "visible" : "hidden"}>
                        <FieldError errors={fieldErrors(field.state.meta.errors)} />
                      </Activity>
                    </Field>
                  )
                }}
              />

              <Field>
                <FieldLabel htmlFor="account-email">Email</FieldLabel>
                <Input
                  id="account-email"
                  value={user.email}
                  disabled
                  autoComplete="email"
                />
                <FieldDescription>
                  Changing email is not available yet.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <nameForm.Subscribe
              selector={(state) =>
                [state.errorMap, state.isSubmitting, state.values.name] as const
              }
            >
              {([errorMap, isSubmitting, name]) => {
                const error = errorMap.onSubmit
                const unchanged = name.trim() === user.name
                return (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {typeof error === "string" ? (
                      <p className="mr-auto text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={Boolean(isSubmitting) || unchanged}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                      Save name
                    </Button>
                  </div>
                )
              }}
            </nameForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>
            Enter your current password to set a new one. Forgot password is not
            available yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="account-password-form"
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              passwordForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <passwordForm.Field
                name="currentPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Current password
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={isInvalid}
                        autoComplete="current-password"
                        required
                      />
                      <Activity mode={isInvalid ? "visible" : "hidden"}>
                        <FieldError errors={fieldErrors(field.state.meta.errors)} />
                      </Activity>
                    </Field>
                  )
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <passwordForm.Field
                  name="newPassword"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          New password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          required
                        />
                        <Activity mode={isInvalid ? "visible" : "hidden"}>
                          <FieldError errors={fieldErrors(field.state.meta.errors)} />
                        </Activity>
                      </Field>
                    )
                  }}
                />

                <passwordForm.Field
                  name="confirmPassword"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Confirm password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          required
                        />
                        <Activity mode={isInvalid ? "visible" : "hidden"}>
                          <FieldError errors={fieldErrors(field.state.meta.errors)} />
                        </Activity>
                      </Field>
                    )
                  }}
                />
              </div>

              <passwordForm.Field
                name="revokeOtherSessions"
                children={(field) => (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="revoke-other-sessions">
                        Sign out other devices
                      </FieldLabel>
                      <FieldDescription>
                        Keep this session and end every other one.
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="revoke-other-sessions"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            <passwordForm.Subscribe
              selector={(state) => [state.errorMap, state.isSubmitting] as const}
            >
              {([errorMap, isSubmitting]) => {
                const error = errorMap.onSubmit
                return (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {typeof error === "string" ? (
                      <p
                        className="mr-auto text-sm text-destructive"
                        role="alert"
                      >
                        {error}
                      </p>
                    ) : null}
                    <Button type="submit" disabled={Boolean(isSubmitting)}>
                      {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                      Update password
                    </Button>
                  </div>
                )
              }}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
