import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../helpers/asyncWrapper";
import UsersController from "../controllers/usersController";
import { authenticate } from "../middlewares/authMiddleware";

const usersRouter = express.Router();

usersRouter.get(
  "/",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getAllUsers(req, res);
  }),
);

usersRouter.get(
  "/:id",
  [authenticate],
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getUserById(req, res);
  }),
);

export default usersRouter;
