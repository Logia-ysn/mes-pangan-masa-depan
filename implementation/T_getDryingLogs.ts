import { T_getDryingLogs } from "../types/api/T_getDryingLogs";
import { prisma } from "../src/libs/prisma";

export const t_getDryingLogs: T_getDryingLogs = async (req, res) => {
  const { limit = 20, offset = 0, id_factory, batch_code } = req.query;

  const where: any = {};
  if (id_factory) where.id_factory = Number(id_factory);
  if (batch_code) where.batch_code = { contains: batch_code, mode: 'insensitive' };

  const [total, data] = await Promise.all([
    prisma.dryingLog.count({ where }),
    prisma.dryingLog.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { drying_date: 'desc' },
      include: {
        Factory: { select: { id: true, name: true } },
        User: { select: { id: true, fullname: true } }
      }
    })
  ]);

  return { total, data: data as any };
};
