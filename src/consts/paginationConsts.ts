import { Prisma } from "@prisma/client";

export const BASE_LIMIT = 100;
export const BASE_OFFSET = 0;
export const BASE_ORDER_BY: Prisma.SortOrder = "asc";

export const MAX_LIMIT = 1000;
