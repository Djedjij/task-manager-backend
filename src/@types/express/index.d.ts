import { Prisma } from "@prisma/client";

export {};

declare global {
  namespace Express {
    interface Request {
      pagination?: {
        take: number;
        skip: number;
        orderBy: Prisma.SortOrder;
      };
    }
  }
}
