import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

//Создаем переиспользуемый объект select с помощью валидатора
const userSafeSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
});

//Создаем тип для данных, которые вернет этот запрос
export type UserSafeDto = Prisma.UserGetPayload<{
  select: typeof userSafeSelect;
}>;

export const UserService = {
  async createUser(email: string, password: string) {
    return await prisma.user.create({
      data: { email, passwordHash: password },
    });
  },

  async getUsers() {
    return await prisma.user.findMany({
      select: userSafeSelect,
    });
  },

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });
  },
};
