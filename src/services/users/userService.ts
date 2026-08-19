import { prisma } from "../../lib/prisma";

export const UserService = {
  async createUser(email: string, password: string) {
    return await prisma.user.create({
      data: { email, passwordHash: password },
    });
  },

  async getUsers() {
    return await prisma.user.findMany();
  },
};
