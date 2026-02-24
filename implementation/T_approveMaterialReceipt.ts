import { T_approveMaterialReceipt } from "../types/api/T_approveMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";
import { ForbiddenError } from "../src/utils/errors";

export const t_approveMaterialReceipt: T_approveMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');

    // Explicitly check role for approve action (disallow ACCOUNTING which has the same hierarchy level)
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERUSER') {
        throw new ForbiddenError('Access denied. Required role: MANAGER or higher.');
    }

    const result = await materialReceiptService.approve(Number(req.path.id), user.id);
    return result;
});
