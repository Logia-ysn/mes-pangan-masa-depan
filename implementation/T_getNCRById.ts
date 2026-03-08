import { T_getNCRById } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";

export const t_getNCRById: T_getNCRById = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const id = Number(req.params.id);
    const ncr = await ncrService.getReportById(id);

    if (!ncr) {
        throw new Error('NCR not found');
    }

    return ncr;
});
