import { T_payMaterialReceipt } from "../types/api/T_payMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";
import { ForbiddenError } from "../src/utils/errors";

export const t_payMaterialReceipt: T_payMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');

    // Explicitly check role for payment action
    if (user.role !== 'ACCOUNTING' && user.role !== 'ADMIN' && user.role !== 'SUPERUSER') {
        throw new ForbiddenError('Access denied. Required role: ACCOUNTING or higher.');
    }

    const result = await materialReceiptService.markAsPaid(Number(req.path.id), req.body as any, user.id);
    return result;
});
