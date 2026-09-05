import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../helpers/asyncWrapper";
import { validate } from "../middlewares/validationMiddleware";
import UsersController from "../controllers/usersController";
import { registerSchema } from "../schemas/userSchema";

const usersRouter = express.Router();

usersRouter.post(
  "/login",
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.login(req, res);
  }),
);

usersRouter.post(
  "/register",
  validate(registerSchema),
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.register(req, res);
  }),
);

usersRouter.get(
  "/",
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getAllUsers(req, res);
  }),
);

usersRouter.get(
  "/:id",
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getUserById(req, res);
  }),
);

export default usersRouter;
