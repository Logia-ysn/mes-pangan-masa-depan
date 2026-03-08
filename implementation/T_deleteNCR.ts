import { T_deleteNCR } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";

export const t_deleteNCR: T_deleteNCR = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const id = Number(req.params.id);

    await ncrService.deleteReport(id, user.id);

    return { success: true };
});
