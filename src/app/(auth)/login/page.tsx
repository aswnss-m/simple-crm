"use client";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Login, loginSchema } from "@/schema/login";
import { useForm } from "@tanstack/react-form-nextjs";
import Link from "next/link";
import { Activity } from "react";


export default function LoginPage() {

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        validators: {
            onSubmit: loginSchema,
        },
        onSubmit: async ({ value }) => {
            const {data,error} = await authClient.signIn.email({
                email: value.email,
                password: value.password,
                // callbackURL:'/'
            })
            if(error) {
                console.debug('Error logging in', JSON.stringify(error, null, 2))
                return
            }
            if(data) {
                console.debug('User logged in successfully', JSON.stringify(data, null, 2))
                return
            }
        }
    })

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>
                    Login
                </CardTitle>
                {/* <CardDescription></CardDescription> */}
                {/* <CardAction>Card Action</CardAction> */}
            </CardHeader>
            <CardContent>
                <form id="login-form" onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}>
                    <FieldGroup>
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
                                            <FieldError errors={field.state.meta.errors} />
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
                                            autoComplete="current-password"
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
                <Button type="submit" form="login-form"  className="w-full">
                    Login
                </Button>
                <p>Don't have an account? <Link href="/register">Register</Link></p>
            </CardFooter>
        </Card>
    );
}