import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export const TaskService = {
  async createTask(task: Prisma.TaskUncheckedCreateInput) {
    return await prisma.task.create({
      data: task,
    });
  },

  async getTasks() {
    return await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getTaskById(id: string) {
    return await prisma.task.findUnique({
      where: { id },
    });
  },

  async getTasksByUserId(userId: string) {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getTasksByProjectId(projectId: string) {
    return await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateTask(id: string, task: Prisma.TaskUncheckedUpdateInput) {
    return await prisma.task.update({
      where: { id },
      data: task,
    });
  },

  async deleteTask(id: string) {
    return await prisma.task.delete({
      where: { id },
    });
  },
};
