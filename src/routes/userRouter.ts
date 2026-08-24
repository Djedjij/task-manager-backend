import express from "express";
import { Request, Response } from "express";
import { asyncWrapper } from "../helpers/asyncWrapper";
import { validate } from "../middlewares/validationMiddleware";
import UsersController from "../controllers/usersController";
import { registerSchema } from "../schemas/userSchema";

const usersRouter = express.Router();

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по его идентификатору
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя (uuid)
 *     responses:
 *       200:
 *         description: Данные успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 42
 *                 name:
 *                   type: string
 *                   example: "Иван Иванов"
 *       404:
 *         description: Пользователь с таким ID не найден
 */

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

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Список пользователей успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "123e4567-e89b-12d3-a456-426614174000"
 *                   name:
 *                     type: string
 *                     example: "Иван Иванов"
 */

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
