import { Request, Response } from "express";
import { ProjectService } from "../services/projectService";
import { AppError } from "../errors/AppError";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectMemberInput,
} from "../schemas/projectSchema";
import {
  BASE_LIMIT,
  BASE_OFFSET,
  BASE_ORDER_BY,
} from "../consts/paginationConsts";
import { sendPaginated } from "../helpers";

class ProjectController {
  /**
   * Создание проекта. Владельцем становится текущий пользователь.
   */
  async createProject(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("Authorization required", 401);
    }

    const body = req.body as CreateProjectInput;

    const project = await ProjectService.createProject({
      title: body.title,
      description: body.description ?? null,
      ownerId: userId,
    });

    res.status(201).json(project);
  }

  /**
   * Все проекты (без привязки к пользователю).
   */
  async getProjects(req: Request, res: Response) {
    const { take, skip, orderBy } = req.pagination!;
    const [projects, total] = await ProjectService.getProjects(
      take,
      skip,
      orderBy,
    );
    sendPaginated(res, projects, total, { take, skip });
  }

  /**
   * Проекты текущего пользователя (собственные + где он участник).
   */
  async getMyProjects(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("Authorization required", 401);
    }

    const projects = await ProjectService.getProjectsByUserId(userId);
    res.status(200).json(projects);
  }

  /**
   * Проект по id (только если пользователь владелец или участник).
   */
  async getProject(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const id = req.params.id;

    if (!userId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof id !== "string") {
      throw new AppError("Invalid project id", 400);
    }

    const isMember = await ProjectService.isProjectMember(id, userId);
    if (!isMember) {
      throw new AppError("Доступ к проекту запрещён", 403);
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      throw new AppError("Проект не найден", 404);
    }

    res.status(200).json(project);
  }

  /**
   * Обновление проекта (только владелец).
   */
  async updateProject(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const id = req.params.id;

    if (!userId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof id !== "string") {
      throw new AppError("Invalid project id", 400);
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      throw new AppError("Проект не найден", 404);
    }
    if (project.ownerId !== userId) {
      throw new AppError("Только владелец может изменить проект", 403);
    }

    const body = req.body as UpdateProjectInput;
    const updated = await ProjectService.updateProject(id, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
    });

    res.status(200).json(updated);
  }

  /**
   * Удаление проекта (только владелец).
   */
  async deleteProject(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const id = req.params.id;

    if (!userId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof id !== "string") {
      throw new AppError("Invalid project id", 400);
    }

    const project = await ProjectService.getProjectById(id);
    if (!project) {
      throw new AppError("Проект не найден", 404);
    }
    if (project.ownerId !== userId) {
      throw new AppError("Только владелец может удалить проект", 403);
    }

    const deleted = await ProjectService.deleteProject(id);
    res.status(200).json(deleted);
  }

  /**
   * Добавление пользователя в проект (только владелец).
   */
  async addMember(req: AuthRequest, res: Response) {
    const currentUserId = req.user?.userId;
    const projectId = req.params.id;

    if (!currentUserId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof projectId !== "string") {
      throw new AppError("Invalid project id", 400);
    }

    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      throw new AppError("Проект не найден", 404);
    }
    if (project.ownerId !== currentUserId) {
      throw new AppError("Только владелец может добавлять участников", 403);
    }

    const { userId, role } = req.body as AddProjectMemberInput;

    const existing = await ProjectService.getMember(projectId, userId);
    if (existing) {
      throw new AppError("Пользователь уже является участником проекта", 409);
    }

    const member = await ProjectService.addMember(
      projectId,
      userId,
      role ?? "member",
    );

    res.status(201).json(member);
  }

  /**
   * Список участников проекта (только владелец или участник).
   */
  async getMembers(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const projectId = req.params.id;

    if (!userId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof projectId !== "string") {
      throw new AppError("Invalid project id", 400);
    }

    const isMember = await ProjectService.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new AppError("Доступ к проекту запрещён", 403);
    }

    const members = await ProjectService.getMembers(projectId);
    res.status(200).json(members);
  }

  /**
   * Удаление участника из проекта (только владелец).
   */
  async removeMember(req: AuthRequest, res: Response) {
    const currentUserId = req.user?.userId;
    const projectId = req.params.id;
    const memberUserId = req.params.userId;

    if (!currentUserId) {
      throw new AppError("Authorization required", 401);
    }
    if (typeof projectId !== "string" || typeof memberUserId !== "string") {
      throw new AppError("Invalid project or user id", 400);
    }

    const project = await ProjectService.getProjectById(projectId);
    if (!project) {
      throw new AppError("Проект не найден", 404);
    }
    if (project.ownerId !== currentUserId) {
      throw new AppError("Только владелец может удалять участников", 403);
    }

    const removed = await ProjectService.removeMember(projectId, memberUserId);
    res.status(200).json(removed);
  }
}

export default new ProjectController();
