import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  console.error(err.stack);

  const status = err instanceof AppError ? err.status : 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
    },
  });
}
