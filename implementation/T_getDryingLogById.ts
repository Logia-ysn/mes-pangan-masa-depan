import { T_getDryingLogById } from "../types/api/T_getDryingLogById";
import { prisma } from "../src/libs/prisma";

export const t_getDryingLogById: T_getDryingLogById = async (req, res) => {
  const { id } = req.path;

  const log = await prisma.dryingLog.findUnique({
    where: { id: Number(id) },
    include: {
      Factory: { select: { id: true, name: true } },
      User: { select: { id: true, fullname: true } }
    }
  });

  if (!log) throw new Error("Drying log not found");

  return log as any;
};
