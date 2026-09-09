"use client"
import { authClient } from "@/lib/auth-client";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const {data:session} = authClient.useSession()
    return (
        <div>
            {children}
        </div>
    );
}