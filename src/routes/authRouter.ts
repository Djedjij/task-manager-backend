import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  getCurrentUser,
} from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validationMiddleware";
import { registerSchema, loginSchema } from "../schemas/userSchema";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/change-password", authenticate, changePassword);
authRouter.get("/me", authenticate, getCurrentUser);

export default authRouter;
