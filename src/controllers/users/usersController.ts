import { Request, Response } from "express";
import { UserService } from "../../services/users/userService";

class UsersController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await UserService.createUser(email, password);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async login(req: Request, res: Response) {
    console.log(req.body);
    res.status(200).json("Success request");
  }

  async logout(req: Request, res: Response) {
    console.log(req.body);
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(400).json({ error });
    }
  }

  async getUserById(req: Request, res: Response) {
    const id = req.params.id;

    try {
      if (typeof id === "string") {
        const user = await UserService.getUserById(id);
        res.status(200).json(user);
      }
    } catch (error) {
      res.status(400).json(error);
    }
  }
}

export default new UsersController();
