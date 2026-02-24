import { T_getMaterialReceipt } from "../types/api/T_getMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_getMaterialReceipt: T_getMaterialReceipt = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const result = await materialReceiptService.getById(Number(req.path.id));
    return result;
});
