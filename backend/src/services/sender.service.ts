import prisma from "../config/prisma.js";

interface CreateSenderInput {
  userId: string;
  email: string;
  etherealUser: string;
  etherealPassword: string;
  hourlyLimit?: number;
}

export async function createSender(
  input: CreateSenderInput,
) {
  return prisma.sender.create({
    data: {
      userId: input.userId,
      email: input.email,
      etherealUser: input.etherealUser,
      etherealPassword: input.etherealPassword,
      hourlyLimit: input.hourlyLimit ?? 200,
    },
  });
}

export async function getSenders(userId: string) {
  return prisma.sender.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      email: true,
      hourlyLimit: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}