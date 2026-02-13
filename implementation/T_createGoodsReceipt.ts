import { T_createGoodsReceipt } from "../types/api/T_createGoodsReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { purchaseOrderService } from "../src/services/purchase-order.service";

export const t_createGoodsReceipt: T_createGoodsReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_purchase_order, receipt_date, notes, items } = req.body;
    const result = await purchaseOrderService.receiveGoods(
        id_purchase_order,
        items,
        receipt_date,
        notes,
        user.id
    );
    return result as any;
});
