import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {

  const session = await getSession()

  //user is already signedin
  if (session) {
    return redirect('/overview')
  }
    return (
        <main className="flex items-center justify-center h-screen w-full">
            {children}
        </main>
    );
}
