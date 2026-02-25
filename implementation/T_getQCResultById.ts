import { T_getQCResultById } from "../types/api/T_getQCResultById";
import { prisma } from "../src/libs/prisma";

export const t_getQCResultById: T_getQCResultById = async (req, res) => {
  const { id } = req.path;

  const result = await prisma.qCResult.findUnique({
    where: { id: Number(id) },
    include: {
      Factory: { select: { id: true, name: true } },
      User: { select: { id: true, fullname: true } },
      Worksheet: { select: { id: true, batch_code: true } }
    }
  });

  if (!result) throw new Error("QC result not found");

  return result as any;

};
