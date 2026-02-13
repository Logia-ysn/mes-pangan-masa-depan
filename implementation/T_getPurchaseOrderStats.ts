import { T_getPurchaseOrderStats } from "../types/api/T_getPurchaseOrderStats";
import { purchaseOrderRepository } from "../src/repositories/purchase-order.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getPurchaseOrderStats: T_getPurchaseOrderStats = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id_factory } = req.query;

    const stats = await purchaseOrderRepository.getStats(
        id_factory ? Number(id_factory) : undefined
    );

    return stats as any;
});
