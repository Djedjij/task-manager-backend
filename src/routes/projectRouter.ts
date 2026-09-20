import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../helpers";
import { authenticate } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { paginate } from "../middlewares/paginationMiddleware";
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
} from "../schemas/projectSchema";
import ProjectController from "../controllers/projectController";

const projectRouter = express.Router();

// CREATE
projectRouter.post(
  "/",
  [authenticate, validate(createProjectSchema)],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.createProject(req, res);
  }),
);

// READ (все проекты)
projectRouter.get(
  "/",
  [authenticate, paginate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.getProjects(req, res);
  }),
);

// READ (проекты текущего пользователя) — ВАЖНО: до "/:id"
projectRouter.get(
  "/my",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.getMyProjects(req, res);
  }),
);

// MEMBERS: список участников
projectRouter.get(
  "/:id/members",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.getMembers(req, res);
  }),
);

// MEMBERS: добавить участника
projectRouter.post(
  "/:id/members",
  [authenticate, validate(addProjectMemberSchema)],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.addMember(req, res);
  }),
);

// MEMBERS: удалить участника
projectRouter.delete(
  "/:id/members/:userId",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.removeMember(req, res);
  }),
);

// READ (один проект)
projectRouter.get(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.getProject(req, res);
  }),
);

// UPDATE
projectRouter.put(
  "/:id",
  [authenticate, validate(updateProjectSchema)],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.updateProject(req, res);
  }),
);

// DELETE
projectRouter.delete(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    await ProjectController.deleteProject(req, res);
  }),
);

export default projectRouter;
