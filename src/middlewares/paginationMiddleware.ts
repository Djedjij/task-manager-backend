import { Request, Response, NextFunction } from "express";
import {
  BASE_LIMIT,
  BASE_OFFSET,
  BASE_ORDER_BY,
  MAX_LIMIT,
} from "../consts/paginationConsts";

export const paginate = (req: Request, res: Response, next: NextFunction) => {
  let { limit, offset, sort } = req.query;

  let take = BASE_LIMIT;

  if (limit && typeof limit === "string") {
    take = parseInt(limit, 10);
    if (isNaN(take) || take <= 0) {
      take = BASE_LIMIT;
    } else if (take > MAX_LIMIT) {
      take = MAX_LIMIT;
    }
  }

  let skip = BASE_OFFSET;

  if (offset && typeof offset === "string") {
    skip = parseInt(offset, 10);
    if (isNaN(skip) || skip <= 0) {
      skip = BASE_OFFSET;
    }
  }

  let orderBy = BASE_ORDER_BY;
  if (sort && (sort === "asc" || sort === "desc")) {
    orderBy = sort;
  }

  req.pagination = { take, skip, orderBy };
  console.log({ take, skip, orderBy });

  next();
};
