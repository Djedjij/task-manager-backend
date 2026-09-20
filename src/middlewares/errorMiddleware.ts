import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";

/**
 * Переводит ошибку любого типа в HTTP-статус и безопасное сообщение.
 */
function resolveError(err: unknown): { status: number; message: string } {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return { status: 404, message: "Запись не найдена" };
      case "P2002":
        return {
          status: 409,
          message: "Запись с такими данными уже существует",
        };
      case "P2003":
        return { status: 400, message: "Некорректная ссылка на связанную запись" };
      case "P2023":
        return { status: 400, message: "Некорректный формат идентификатора" };
      default:
        return { status: 400, message: "Некорректный запрос к базе данных" };
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Некорректные данные запроса" };
  }

  return { status: 500, message: "Internal server error" };
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const { status, message } = resolveError(err);

  if (status >= 500) {
    console.error(err);
  } else {
    console.warn(`[${status}] ${message}`);
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
    },
  });
}
