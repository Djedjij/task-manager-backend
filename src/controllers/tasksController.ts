import { Response } from "express";
import { TaskService } from "../services/taskService";
import { ProjectService } from "../services/projectService";
import { AppError } from "../errors/AppError";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ETaskStatus } from "../types/task.types";
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskIdParam,
  TaskProjectParam,
  TaskUserParam,
  updateTaskSchema,
} from "../schemas/taskSchema";

class TaskController {
  /**
   * id текущего пользователя из access-токена (ставит authenticate).
   */
  private getUserId(req: AuthRequest): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("Authorization required", 401);
    }
    return userId;
  }

  /**
   * Задача с проверкой доступа: сейчас — только владелец задачи.
   */
  private async getOwnTask(taskId: string, userId: string) {
    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      throw new AppError("Задача не найдена", 404);
    }
    if (task.userId !== userId) {
      throw new AppError("Доступ к задаче запрещён", 403);
    }
    return task;
  }

  async createTask(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const body = req.body as CreateTaskInput;
    const projectId = body.projectId ?? null;

    if (projectId) {
      const isMember = await ProjectService.isProjectMember(projectId, userId);
      if (!isMember) {
        throw new AppError("Доступ к проекту запрещён", 403);
      }
    }

    // userId берётся из токена, а не из body: иначе задачу можно привязать к чужому пользователю
    const newTask = await TaskService.createTask({
      title: body.title,
      description: body.description ?? null,
      dueAt: body.dueAt ?? null,
      projectId,
      userId,
      status: body.status ?? ETaskStatus.created,
      tag: body.tag ?? [],
    });

    res.status(201).json(newTask);
  }

  /**
   * Задачи текущего пользователя.
   */
  async getTasks(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const tasks = await TaskService.getTasksByUserId(userId);
    res.status(200).json(tasks);
  }

  async getTask(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const { id } = req.params as TaskIdParam;

    const task = await this.getOwnTask(id, userId);
    res.status(200).json(task);
  }

  async getTasksByUserId(req: AuthRequest, res: Response) {
    const currentUserId = this.getUserId(req);
    const { userId } = req.params as TaskUserParam;

    if (userId !== currentUserId) {
      throw new AppError("Доступ к задачам другого пользователя запрещён", 403);
    }

    const tasks = await TaskService.getTasksByUserId(userId);
    res.status(200).json(tasks);
  }

  async getTasksByProjectId(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const { projectId } = req.params as TaskProjectParam;

    const isMember = await ProjectService.isProjectMember(projectId, userId);
    if (!isMember) {
      throw new AppError("Доступ к проекту запрещён", 403);
    }

    const tasks = await TaskService.getTasksByProjectId(projectId);
    res.status(200).json(tasks);
  }

  async updateTask(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const { id } = req.params as TaskIdParam;
    await this.getOwnTask(id, userId);

    const body = updateTaskSchema.parse(req.body);

    if (body.projectId) {
      const isMember = await ProjectService.isProjectMember(
        body.projectId,
        userId,
      );
      if (!isMember) {
        throw new AppError("Доступ к проекту запрещён", 403);
      }
    }

    const updatedTask = await TaskService.updateTask(id, body);
    res.status(200).json(updatedTask);
  }

  async deleteTask(req: AuthRequest, res: Response) {
    const userId = this.getUserId(req);
    const { id } = req.params as TaskIdParam;
    await this.getOwnTask(id, userId);

    await TaskService.deleteTask(id);
    res.status(204).send();
  }
}

export default new TaskController();
