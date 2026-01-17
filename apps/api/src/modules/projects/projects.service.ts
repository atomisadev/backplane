import { prisma } from "../../db";
import { encrypt } from "../../lib/crypto";
import { DbType } from "@prisma/client";

interface CreateProjectInput {
  userId: string;
  name: string;
  dbType: DbType;
  connectionUri: string;
}

export const projectService = {
  async create(data: CreateProjectInput) {
    const encryptedUri = encrypt(data.connectionUri);

    return await prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        dbType: data.dbType,
        connectionUri: encryptedUri,
      },
    });
  },

  async getAllByUser(userId: string) {
    return await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        dbType: true,
        createdAt: true,
      },
    });
  },

  async getById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return null;
    }

    return project;
  },
};
