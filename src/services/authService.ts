import { AppError } from "../errors/AppError";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAndDecodeRefreshToken,
} from "../helpers/jwtHelpers";
import { comparePassword, hashPassword } from "../helpers/passwordHelpers";
import { prisma } from "../lib/prisma";
import {
  TAuthResponse,
  TLoginUserDto,
  TRegisterUserDto,
  TTokenPayload,
} from "../types/auth.types";
class AuthService {
  async register(data: TRegisterUserDto): Promise<TAuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new AppError("Пользователь с таким email уже существует", 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        hashedPassword,
      },
    });

    const tokenPayload: TTokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token, hashedToken } = await generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedToken },
    });

    return {
      accessToken,
      refreshToken: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(data: TLoginUserDto): Promise<TAuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError("Incorrect email or password", 401);
    }

    const isValidPassword = await comparePassword(
      data.password,
      user.hashedPassword,
    );

    if (!isValidPassword) {
      throw new AppError("Incorrect email or password", 401);
    }

    const tokenPayload: TTokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token, hashedToken } = await generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedToken },
    });

    return {
      accessToken,
      refreshToken: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const payload = verifyAndDecodeRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError("Invalid refresh token", 401);
      }

      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      console.log(error);
      throw new AppError("Invalid refresh token", 401);
    }
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not find", 404);
    }

    const isValidPassword = await comparePassword(
      currentPassword,
      user.hashedPassword,
    );

    if (!isValidPassword) {
      throw new AppError("Invalid current password", 401);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });
  }
}

export const authService = new AuthService();
