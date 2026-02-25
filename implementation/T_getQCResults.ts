import { T_getQCResults } from "../types/api/T_getQCResults";
import { prisma } from "../src/libs/prisma";

export const t_getQCResults: T_getQCResults = async (req, res) => {
  const { limit = 20, offset = 0, id_factory, batch_code } = req.query;

  const where: any = {};
  if (id_factory) where.id_factory = Number(id_factory);
  if (batch_code) where.batch_code = { contains: batch_code, mode: 'insensitive' };

  const [total, data] = await Promise.all([
    prisma.qCResult.count({ where }),
    prisma.qCResult.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { qc_date: 'desc' },
      include: {
        Factory: { select: { id: true, name: true } },
        User: { select: { id: true, fullname: true } },
        Worksheet: { select: { id: true, batch_code: true } }
      }
    })
  ]);

  return { total, data: data as any };
};
