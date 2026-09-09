"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/types/login";
import { useForm } from "@tanstack/react-form-nextjs";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Activity } from "react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function LoginPage() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema, //zod validation
      onSubmitAsync: async ({ value }) => {
        const { error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (error) {
          return {
            form: error.message,
            fields: {
              email: true,
              password: true,
            },
          };
        }
      },
    },
    onSubmit: async () => {
      console.log("Loged in");
    },
  });

  useEffect(() => {
    console.log("form is submitting :", form.state.isSubmitting);
  }, [form.state.isSubmitting]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        {/* <CardDescription></CardDescription> */}
        {/* <CardAction>Card Action</CardAction> */}
      </CardHeader>
      <CardContent>
        <form
          id="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="email"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      aria-invalid={isInvalid}
                      placeholder="jondoe@example.com"
                      autoComplete="email"
                    />
                    <Activity mode={isInvalid ? "visible" : "hidden"}>
                      <FieldError
                        errors={field.state.meta.errors.filter(
                          (e) => typeof e === "string",
                        )}
                      />
                    </Activity>
                  </Field>
                );
              }}
            />

            <form.Field
              name="password"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      aria-invalid={isInvalid}
                      placeholder="******"
                      autoComplete="current-password"
                      type="password"
                    />
                    <Activity mode={isInvalid ? "visible" : "hidden"}>
                      <FieldError
                        errors={field.state.meta.errors.filter(
                          (e) => typeof e === "string",
                        )}
                      />
                    </Activity>
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <form.Subscribe
          selector={(state) => [state.errorMap]}
          children={([errorMap]) => {
            const error = errorMap.onSubmit;

            if (!error) return null;

            // If it's the string returned from your onSubmitAsync
            if (typeof error === "string") {
              return (
                <div
                  className="mb-2 text-sm font-medium text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              );
            }

            // If it's schema issues from Standard Schema (loginSchema)
            return (
              <div
                className="mb-2 text-sm font-medium text-destructive"
                role="alert"
              >
                {Object.values(error)
                  .flat()
                  .map((issue) => issue.message)
                  .join(", ")}
              </div>
            );
          }}
        />
        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin ml-2" />
              ) : (
                "Login"
              )}
            </Button>
          )}
        </form.Subscribe>
        <p>
          Dont have an account?{" "}
          <Link
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "px-0",
            )}
            href="/register"
          >
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
