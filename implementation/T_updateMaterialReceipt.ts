import { T_updateMaterialReceipt } from "../types/api/T_updateMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_updateMaterialReceipt: T_updateMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const result = await materialReceiptService.update(Number(req.path.id), req.body, user.id);
    return result;
});
