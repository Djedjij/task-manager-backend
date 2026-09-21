import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Название проекта обязательно").max(255),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1, "Название проекта обязательно").max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid("Неверный формат userId"),
  role: z.enum(["owner", "admin", "member"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;