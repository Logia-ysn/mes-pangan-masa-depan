import { T_deletePurchaseOrder } from "../types/api/T_deletePurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_deletePurchaseOrder: T_deletePurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    const id = Number(req.path.id);
    const result = await purchaseOrderService.deletePO(id, user.id);
    return result as any;
});
