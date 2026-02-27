import { T_updateQCResult } from "../types/api/T_updateQCResult";
import { qcResultService } from "../src/services/qc-result.service";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_updateQCResult: T_updateQCResult = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const { id, ...dto } = req.body;

    const qcResult = await qcResultService.update({
        id: Number(id),
        id_user: user.id,
        ...dto
    });

    return qcResult as any;
});
