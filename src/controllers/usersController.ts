import { Response } from "express";
import { UserService } from "../services/userService";
import { AppError } from "../errors/AppError";
import { AuthRequest } from "../middlewares/authMiddleware";
import { UserIdParam } from "../schemas/userSchema";

class UsersController {
  /**
   * Список пользователей (без хешей паролей и refresh-токенов).
   */
  async getAllUsers(_req: AuthRequest, res: Response) {
    const users = await UserService.getUsers();
    res.status(200).json(users);
  }

  /**
   * Пользователь по id.
   */
  async getUserById(req: AuthRequest, res: Response) {
    const { id } = req.params as UserIdParam;

    const user = await UserService.getUserById(id);
    if (!user) {
      throw new AppError("Пользователь не найден", 404);
    }

    res.status(200).json(user);
  }
}

export default new UsersController();
