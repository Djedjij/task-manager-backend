import { Response } from "express";

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  pagination: { take: number; skip: number },
): Response<Paginated<T>> => {
  return res.json({
    data,
    meta: {
      total,
      limit: pagination.take,
      offset: pagination.skip,
    },
  });
};
