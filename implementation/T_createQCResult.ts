import { T_createQCResult } from "../types/api/T_createQCResult";
import { qcResultService } from "../src/services/qc-result.service";

export const t_createQCResult: T_createQCResult = async (req, res) => {
  const {
    id_factory, qc_date, batch_code, id_worksheet,
    moisture_content, broken_percentage, whiteness_degree, grade, notes
  } = req.body;
  const user = (res as any).locals.user;

  try {
    const qcResult = await qcResultService.create({
      id_factory: Number(id_factory),
      id_user: user.id,
      qc_date,
      batch_code: batch_code || undefined,
      id_worksheet: id_worksheet ? Number(id_worksheet) : undefined,
      moisture_content: moisture_content ? Number(moisture_content) : undefined,
      broken_percentage: broken_percentage ? Number(broken_percentage) : undefined,
      whiteness_degree: whiteness_degree ? Number(whiteness_degree) : undefined,
      grade: grade || undefined,
      notes: notes || undefined
    });

    return qcResult as any;
  } catch (error: any) {
    if (error.name === 'BusinessRuleError') {
      throw error;
    }
    console.error("Error creating QC result:", error);
    throw new Error("Internal server error");
  }
};
