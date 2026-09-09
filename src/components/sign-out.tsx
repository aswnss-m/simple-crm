"use client"
import { Button } from "./ui/button";
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export default function SignOut({
  variant = "destructive",
  size ='default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {

  const [isPending, startTransition] = useTransition()
  const handleSignout = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            redirect('/login')
          }
        }
      })
    })
  }
  return <Button variant={variant} size={size} {...props} onClick={handleSignout} disabled={isPending} >
    { isPending ? <><Loader2  className="animate-spin"/></> : "Logout"}
  </Button>
}
