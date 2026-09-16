import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../helpers/asyncWrapper";
import { authenticate } from "../middlewares/authMiddleware";
import TasksController from "../controllers/tasksController";

const taskRouter = express.Router();

// POST

taskRouter.post(
  "/",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.createTask(req, res);
  }),
);

//  GET

taskRouter.get(
  "/user/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.getTasksByUserId(req, res);
  }),
);

taskRouter.get(
  "/",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.getTasks(req, res);
  }),
);

taskRouter.get(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.getTask(req, res);
  }),
);

// DELETE

taskRouter.delete(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.deleteTask(req, res);
  }),
);

// UPDATE

taskRouter.put(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await TasksController.updateTask(req, res);
  }),
);

export default taskRouter;
