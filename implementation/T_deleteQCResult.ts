import { T_deleteQCResult } from "../types/api/T_deleteQCResult";
import { qcResultService } from "../src/services/qc-result.service";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_deleteQCResult: T_deleteQCResult = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const id = Number(req.path?.id || req.query?.id);

    if (!id || isNaN(id)) {
        throw new Error('QC Result ID is required');
    }

    await qcResultService.delete(id, user.id);
    return { success: true } as any;
});
