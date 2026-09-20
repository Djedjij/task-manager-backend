import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";

// Переиспользуемые объекты select
const projectOwnerSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
});

const projectSelect = Prisma.validator<Prisma.ProjectSelect>()({
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

const projectWithRelationsSelect = Prisma.validator<Prisma.ProjectSelect>()({
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: projectOwnerSelect },
  members: {
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
      user: { select: projectOwnerSelect },
    },
  },
});

export type ProjectSafeDto = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}>;

export type ProjectWithRelationsDto = Prisma.ProjectGetPayload<{
  select: typeof projectWithRelationsSelect;
}>;

export const ProjectService = {
  async createProject(data: Prisma.ProjectUncheckedCreateInput) {
    return await prisma.project.create({
      data,
      select: projectSelect,
    });
  },

  async getProjects(take: number, skip: number, orderBy: Prisma.SortOrder) {
    return await prisma.project.findMany({
      select: projectSelect,
      orderBy: { createdAt: orderBy },
      take,
      skip,
    });
  },

  /**
   * Проекты, доступные пользователю: собственные + те, где он участник.
   */
  async getProjectsByUserId(userId: string) {
    return await prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: projectSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async getProjectById(id: string) {
    return await prisma.project.findUnique({
      where: { id },
      select: projectWithRelationsSelect,
    });
  },

  async updateProject(id: string, data: Prisma.ProjectUpdateInput) {
    return await prisma.project.update({
      where: { id },
      data,
      select: projectSelect,
    });
  },

  async deleteProject(id: string) {
    return await prisma.project.delete({
      where: { id },
      select: projectSelect,
    });
  },

  /**
   * Проверяет, что пользователь является владельцем проекта или его участником.
   */
  async isProjectMember(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new AppError("Проект не найден", 404);
    }

    if (project.ownerId === userId) {
      return true;
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });

    return Boolean(membership);
  },

  /**
   * Добавляет пользователя в проект. Владелец проекта автоматически
   * не добавляется как участник, но может быть добавлен явно.
   */
  async addMember(projectId: string, userId: string, role: string = "member") {
    return await prisma.projectMember.create({
      data: { projectId, userId, role },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        createdAt: true,
        user: { select: projectOwnerSelect },
      },
    });
  },

  async getMembers(projectId: string) {
    return await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        createdAt: true,
        user: { select: projectOwnerSelect },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async removeMember(projectId: string, userId: string) {
    return await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        createdAt: true,
      },
    });
  },

  async getMember(projectId: string, userId: string) {
    return await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });
  },
};
