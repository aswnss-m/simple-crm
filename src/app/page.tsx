import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // already logged in
  if (session) {
    redirect("/overview");
  }
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="flex gap-4">
        <Link href="/login" type="button" tabIndex={0}>
          Login
        </Link>
        <Link href="/register" type="button " tabIndex={0}>
          Register
        </Link>
      </div>
    </div>
  );
}
