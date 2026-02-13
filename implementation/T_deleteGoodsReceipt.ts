import { T_deleteGoodsReceipt } from "../types/api/T_deleteGoodsReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_deleteGoodsReceipt: T_deleteGoodsReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    const id = Number(req.path.id);
    const result = await purchaseOrderService.deleteGoodsReceipt(id, user.id);
    return result as any;
});
