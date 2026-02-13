import { T_updatePurchaseOrder } from "../types/api/T_updatePurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_updatePurchaseOrder: T_updatePurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const id = Number(req.path.id);
    const result = await purchaseOrderService.updatePO(id, req.body, user.id);
    return result as any;
});
