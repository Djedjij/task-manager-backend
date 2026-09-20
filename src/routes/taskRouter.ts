import express from "express";
import { Response } from "express";
import { asyncWrapper } from "../helpers";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  taskProjectParamSchema,
  taskUserParamSchema,
} from "../schemas/taskSchema";
import TasksController from "../controllers/tasksController";

const taskRouter = express.Router();

// POST

taskRouter.post(
  "/",
  [authenticate, validate(createTaskSchema)],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.createTask(req, res);
  }),
);

//  GET
// Статические сегменты объявляем до "/:id"

taskRouter.get(
  "/user/:userId",
  [authenticate, validate(taskUserParamSchema, "params")],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.getTasksByUserId(req, res);
  }),
);

taskRouter.get(
  "/project/:projectId",
  [authenticate, validate(taskProjectParamSchema, "params")],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.getTasksByProjectId(req, res);
  }),
);

taskRouter.get(
  "/",
  [authenticate],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.getTasks(req, res);
  }),
);

taskRouter.get(
  "/:id",
  [authenticate, validate(taskIdParamSchema, "params")],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.getTask(req, res);
  }),
);

// DELETE

taskRouter.delete(
  "/:id",
  [authenticate, validate(taskIdParamSchema, "params")],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.deleteTask(req, res);
  }),
);

// UPDATE

taskRouter.put(
  "/:id",
  [
    authenticate,
    validate(taskIdParamSchema, "params"),
    validate(updateTaskSchema),
  ],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await TasksController.updateTask(req, res);
  }),
);

export default taskRouter;
