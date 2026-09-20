import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
});

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Неверный формат id"),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
