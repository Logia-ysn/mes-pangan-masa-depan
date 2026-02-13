import { T_createPurchaseOrder } from "../types/api/T_createPurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_createPurchaseOrder: T_createPurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const result = await purchaseOrderService.createPO(req.body, user.id);
    return result as any;
});
