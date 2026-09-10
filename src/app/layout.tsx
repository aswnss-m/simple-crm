import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/providers/provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Simple CRM",
  description: "Simple CRM for managing your customers and sales",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-sans", outfit.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full w-full flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
