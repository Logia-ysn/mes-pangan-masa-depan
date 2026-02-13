import { T_approvePurchaseOrder } from "../types/api/T_approvePurchaseOrder";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_approvePurchaseOrder: T_approvePurchaseOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');
    const id = Number(req.path.id);
    const result = await purchaseOrderService.approvePO(id, user.id);
    return result as any;
});
