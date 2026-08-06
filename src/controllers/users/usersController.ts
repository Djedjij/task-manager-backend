import { Request, Response } from "express";

class UsersController {
  async register(req: Request, res: Response) {
    console.log(req.body);
    res.status(200).json("Success request");
  }

  async login(req: Request, res: Response) {
    console.log(req.body);
    res.status(200).json("Success request");
  }

  async logout(req: Request, res: Response) {
    console.log(req.body);
  }
}

export default new UsersController();
