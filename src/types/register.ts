import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(1, {message: 'Name is required'}),
    email: z.email(),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long'}),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
});

export type Register = z.infer<typeof registerSchema>;