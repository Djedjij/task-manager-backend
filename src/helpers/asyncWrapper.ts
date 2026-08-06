import { Request, Response, NextFunction } from "express";

type AsyncWrapper = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncWrapper = (fn: AsyncWrapper) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
