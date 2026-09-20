import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

//Создаем переиспользуемый объект select с помощью валидатора
const userSafeSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSafeDto = Prisma.UserGetPayload<{
  select: typeof userSafeSelect;
}>;

export const UserService = {
  async getUsers() {
    return await prisma.user.findMany({
      select: userSafeSelect,
      orderBy: { createdAt: "asc" },
    });
  },

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
  },
};
