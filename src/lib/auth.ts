import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma"; // your prisma client instance

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "sqlite", ...etc
    }),
    emailAndPassword:{
        enabled:true,
    },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // 10 min , 600 seconds,
      strategy:'jwe'
    }
  },
  advanced: {
      cookiePrefix:"simplecrm"
  },
});
