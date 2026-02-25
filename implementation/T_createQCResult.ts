import { T_createQCResult } from "../types/api/T_createQCResult";
import { prisma } from "../src/libs/prisma";

export const t_createQCResult: T_createQCResult = async (req, res) => {
  const { id_factory, qc_date, batch_code, id_worksheet, moisture_content, broken_percentage, whiteness_degree, grade, notes } = req.body;
  const user = (res as any).locals.user;

  try {
    const qcResult = await prisma.qCResult.create({
      data: {
        id_factory: Number(id_factory),
        id_user: user.id,
        qc_date: new Date(qc_date),
        batch_code: batch_code || null,
        id_worksheet: id_worksheet ? Number(id_worksheet) : null,
        moisture_content: moisture_content ? Number(moisture_content) : null,
        broken_percentage: broken_percentage ? Number(broken_percentage) : null,
        whiteness_degree: whiteness_degree ? Number(whiteness_degree) : null,
        grade: grade || null,
        notes: notes || null
      }
    });

    return qcResult as any;
  } catch (error: any) {
    console.error("Error creating QC result:", error);
    throw new Error("Internal server error");
  }
};
