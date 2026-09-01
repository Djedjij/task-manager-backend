import { Request, Response } from "express";
import { TaskService } from "../services/taskService";

class TaskController {
  async createTask(req: Request, res: Response) {
    try {
      const task = req.body;
      const newTask = await TaskService.createTask(task);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const tasks = await TaskService.getTasks();
      res.status(200).json(tasks);
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (typeof id === "string") {
        const task = await TaskService.getTaskById(id);
        res.status(200).json(task);
      }
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async getTasksByUserId(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (typeof id === "string") {
        const tasks = await TaskService.getTasksByUserId(id);
        res.status(200).json(tasks);
      }
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (typeof id === "string") {
        const task = await TaskService.deleteTask(id);
        res.status(200).json(task);
      }
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const task = req.body;
      if (task?.id) {
        const updatedTask = await TaskService.updateTask(task?.id, task);
        res.status(200).json(updatedTask);
      }
    } catch (error) {
      res.status(400).json({ error });
    }
  }
}

export default new TaskController();
