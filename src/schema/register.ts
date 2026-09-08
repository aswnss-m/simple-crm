import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
});

export type Register = z.infer<typeof registerSchema>;