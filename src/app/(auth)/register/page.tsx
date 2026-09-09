"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent,  CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { registerSchema } from "@/types/register";
import { useForm } from "@tanstack/react-form-nextjs";
import Link from "next/link";
import { Activity } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";


export default function RegisterPage() {

  const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
          onSubmit: registerSchema, //zod validation
          onSubmitAsync: async ({ value }) => {
            const {  error } = await authClient.signUp.email({
              name: value.name,
              email: value.email,
              password: value.password,
            })

            if (error) {
              if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                return {
                  fields: {
                    email: error.message,
                  },
                }
              }
              return { form: "Something went wrong. Please try again." }
            }

            return null // ✅ must return null on success
          },
        },
        onSubmit: async () => {
          console.log("Called after validation")
        },
    })


    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>
                    Register
                </CardTitle>
                {/* <CardDescription></CardDescription> */}
                {/* <CardAction>Card Action</CardAction> */}
            </CardHeader>
            <CardContent>
                <form id="register-form" onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <FieldGroup>

                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                            htmlFor={field.name}
                                        >
                                            Name
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => { field.handleChange(e.target.value) }}
                                            aria-invalid={isInvalid}
                                            placeholder="John Doe"
                                            autoComplete="name"
                                        />
                                        <Activity mode={isInvalid ? 'visible' : 'hidden'}>
                                            <FieldError errors={field.state.meta.errors} />
                                        </Activity>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="email"
                            children={(field) => {

                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                            htmlFor={field.name}
                                        >
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => { field.handleChange(e.target.value) }}
                                            aria-invalid={isInvalid}
                                            placeholder="jondoe@example.com"
                                            autoComplete="email"
                                        />
                                        <Activity mode={isInvalid ? 'visible' : 'hidden'}>
                                            {/*<FieldError errors={field.state.meta.errors ?? ""} />*/}
                                            {/*? Since we are trasforming email error we need to check for typeof error string*/}
                                            <FieldError
                                                errors={field.state.meta.errors.map((error) => {
                                                    if (!error) return undefined;

                                                    if (typeof error === "string") {
                                                        return { message: error };
                                                    }

                                                    return { message: error.message };
                                                })}
                                            />
                                        </Activity>
                                    </Field>
                                )
                            }}
                        />

                        <form.Field
                            name="password"
                            children={(field) => {

                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                            htmlFor={field.name}
                                        >
                                            Password
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => { field.handleChange(e.target.value) }}
                                            aria-invalid={isInvalid}
                                            placeholder="******"
                                            autoComplete="new-password"
                                            type="password"
                                        />
                                        <Activity mode={isInvalid ? 'visible' : 'hidden'}>
                                            <FieldError errors={field.state.meta.errors} />
                                        </Activity>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="confirmPassword"
                            children={(field) => {

                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                            htmlFor={field.name}
                                        >
                                            Confirm Password
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => { field.handleChange(e.target.value) }}
                                            aria-invalid={isInvalid}
                                            placeholder="******"
                                            autoComplete="new-password"
                                            type="password"
                                        />
                                        <Activity mode={isInvalid ? 'visible' : 'hidden'}>
                                            <FieldError errors={field.state.meta.errors} />
                                        </Activity>
                                    </Field>
                                )
                            }}
                        />

                    </FieldGroup>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <form.Subscribe
                selector={(state) => [state.errorMap]}
                children={([errorMap]) => {
                  const error = errorMap.onSubmit

                  if (!error) return null

                  // If it's the string returned from your onSubmitAsync
                  if (typeof error === 'string') {
                    return (
                      <div className="mb-2 text-sm font-medium text-destructive" role="alert">
                        {error}
                      </div>
                    )
                  }

                  // If it's schema issues from Standard Schema (loginSchema)
                  return (
                    <div className="mb-2 text-sm font-medium text-destructive" role="alert">
                      {Object.values(error)
                        .flat()
                        .map((issue) => issue.message)
                        .join(', ')}
                    </div>
                  )
                }}
              />
              <form.Subscribe selector={(state) => [state.isSubmitting]}>
                  {([isSubmitting]) => (
                    <Button
                      type="submit"
                      form="register-form"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin ml-2" /> : 'Register'}
                    </Button>
                  )}
                </form.Subscribe>
                <p>Already have an account? <Link className={cn(buttonVariants({ variant: 'link', size: 'sm' }), "px-0")} href="/login">Login</Link></p>
            </CardFooter>
        </Card>
    );
}
