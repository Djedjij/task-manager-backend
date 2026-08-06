import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../../helpers/asyncWrapper";
import { validate } from "../../middlewares/validationMiddleware";
import UsersController from "../../controllers/users/usersController";
import { registerSchema } from "../../schemas/users/schemas";

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

export default usersRouter;
