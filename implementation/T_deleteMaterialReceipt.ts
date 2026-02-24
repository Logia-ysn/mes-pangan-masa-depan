import { T_deleteMaterialReceipt } from "../types/api/T_deleteMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_deleteMaterialReceipt: T_deleteMaterialReceipt = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const result = await materialReceiptService.delete(Number(req.path.id));
    return result;
});
