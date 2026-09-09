"use client";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { registerSchema } from "@/schema/register";
import { useForm } from "@tanstack/react-form-nextjs";
import Link from "next/link";
import { Activity } from "react";


export default function RegisterPage() {

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
        validators: {
            onSubmit: registerSchema,
        },
        onSubmit: async ({ value }) => {
            const {data,error} = await signUp.email({
                name: value.name,
                email: value.email,
                password: value.password,
                // callbackURL:'/'
            })
            if(error) {
                console.debug('Error registering user', JSON.stringify(error, null, 2))
                return
            }
            if(data) {
                console.debug('User registered successfully', JSON.stringify(data, null, 2))
                return
            }
        }
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
                <Button type="submit" form="register-form"  className="w-full">
                    Register
                </Button>
                <p>Already have an account? <Link href="/login">Login</Link></p>
            </CardFooter>
        </Card>
    );
}