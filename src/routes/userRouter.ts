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
 *                   email:
 *                     type: string
 *                     example: "email@email.com"
 *                   createdAt:
 *                     type: string
 *                     example: "2026-08-19T19:31:59.494Z"
 *                   updatedAt:
 *                     type: string
 *                     example: "2026-08-19T19:31:59.494Z"
 */

usersRouter.get(
  "/",
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getAllUsers(req, res);
  }),
);

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
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   example: "email@email.com"
 *                 createdAt:
 *                   type: string
 *                   example: "2026-08-19T19:31:59.494Z"
 *                 updatedAt:
 *                   type: string
 *                   example: "2026-08-19T19:31:59.494Z"
 *       404:
 *         description: Пользователь с таким ID не найден
 */

usersRouter.get(
  "/:id",
  asyncWrapper(async (req: Request, res: Response) => {
    UsersController.getUserById(req, res);
  }),
);

export default usersRouter;
