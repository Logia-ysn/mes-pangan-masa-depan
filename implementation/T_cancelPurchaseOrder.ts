import { T_cancelPurchaseOrder } from "../types/api/T_cancelPurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_cancelPurchaseOrder: T_cancelPurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');
    const id = Number(req.path.id);
    const result = await purchaseOrderService.cancelPO(id, user.id);
    return result as any;
});
