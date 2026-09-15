import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

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
      {/* <Image src={"/night-background.webp"} alt="" className="w-full absolute bottom-0 -z-10" width={2100} height={900}/> */}
    </div>
  );
}
