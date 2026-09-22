import { z } from "zod";
import { ETaskStatus } from "../types/task.types";

const id = z.string().uuid("Неверный формат id");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title required").max(255),
  description: z.string().trim().max(1000).nullish(),
  dueAt: z.coerce.date().nullish(),
  projectId: id.nullish(),
  status: z.enum(ETaskStatus),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskIdParamSchema = z.object({ id });
export const taskProjectParamSchema = z.object({ projectId: id });
export const taskUserParamSchema = z.object({ userId: id });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type TaskProjectParam = z.infer<typeof taskProjectParamSchema>;
export type TaskUserParam = z.infer<typeof taskUserParamSchema>;
