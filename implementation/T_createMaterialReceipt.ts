import { T_createMaterialReceipt } from "../types/api/T_createMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_createMaterialReceipt: T_createMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const result = await materialReceiptService.create(req.body, user.id);
    return result;
});
