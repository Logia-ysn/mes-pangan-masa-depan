import { T_getPurchaseOrders } from "../types/api/T_getPurchaseOrders";
import { purchaseOrderRepository } from "../src/repositories/purchase-order.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getPurchaseOrders: T_getPurchaseOrders = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, id_supplier, status, start_date, end_date } = req.query;

    const { data, total } = await purchaseOrderRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        id_factory: id_factory ? Number(id_factory) : undefined,
        id_supplier: id_supplier ? Number(id_supplier) : undefined,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
