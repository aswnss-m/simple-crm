import Link from "next/link";

export default function Home() {
  return (
<div className="flex items-center justify-center h-screen w-full">
  <div className="flex gap-4">
  <Link href="/login" type="button" tabIndex={0}>Login</Link>
  <Link href="/register" type="button " tabIndex={0}>Register</Link>

  </div>
</div>
  );
}
