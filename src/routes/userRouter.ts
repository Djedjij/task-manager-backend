import express from "express";
import { Response } from "express";
import { asyncWrapper } from "../helpers/asyncWrapper";
import UsersController from "../controllers/usersController";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { userIdParamSchema } from "../schemas/userSchema";

const usersRouter = express.Router();

usersRouter.get(
  "/",
  [authenticate],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await UsersController.getAllUsers(req, res);
  }),
);

usersRouter.get(
  "/:id",
  [authenticate, validate(userIdParamSchema, "params")],
  asyncWrapper(async (req: AuthRequest, res: Response) => {
    await UsersController.getUserById(req, res);
  }),
);

export default usersRouter;
