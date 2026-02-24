import { T_getMaterialReceipts } from "../types/api/T_getMaterialReceipts";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_getMaterialReceipts: T_getMaterialReceipts = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const result = await materialReceiptService.getAll(req.query);
    return result;
});
