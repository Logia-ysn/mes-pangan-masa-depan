import { T_getPurchaseOrder } from "../types/api/T_getPurchaseOrder";
import { purchaseOrderRepository } from "../src/repositories/purchase-order.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { NotFoundError } from "../src/utils/errors";

export const t_getPurchaseOrder: T_getPurchaseOrder = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const id = Number(req.path.id);

    const po = await purchaseOrderRepository.findById(id);
    if (!po) {
        throw new NotFoundError('PurchaseOrder', id);
    }

    return po as any;
});
