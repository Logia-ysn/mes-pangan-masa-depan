import { T_getQCResults } from "../types/api/T_getQCResults";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_getQCResults: T_getQCResults = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { limit = 20, offset = 0, id_factory, batch_code } = req.query;

  const where: any = {};
  if (id_factory) where.id_factory = Number(id_factory);
  if (batch_code) where.batch_code = { contains: batch_code as string, mode: 'insensitive' };

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
});
