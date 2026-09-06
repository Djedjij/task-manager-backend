import { Request, Response, NextFunction } from "express";
import {
  TChangePasswordDto,
  TLoginUserDto,
  TRegisterUserDto,
} from "../types/auth.types";
import { authService } from "../services/authService";
import { AppError } from "../errors/AppError";
import { AuthRequest } from "../middlewares/authMiddleware";
import { prisma } from "../lib/prisma";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data: TRegisterUserDto = req.body;
    const result = await authService.register(data);
    const response = { accessToken: result.accessToken, user: result.user };

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data: TLoginUserDto = req.body;
    const result = await authService.login(data);

    const response = { accessToken: result.accessToken, user: result.user };

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.cookie("refreshToken", result, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
    });
    
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("The user is not authorized", 401);
    }

    await authService.logout(userId);

    res.json({
      success: true,
      message: "Success",
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("The user is not authorized", 401);
    }

    const data: TChangePasswordDto = req.body;
    await authService.changePassword(
      userId,
      data.currentPassword,
      data.newPassword,
    );

    res.json({
      success: true,
      message: "Password successfuly updated",
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Пользователь не авторизован", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
