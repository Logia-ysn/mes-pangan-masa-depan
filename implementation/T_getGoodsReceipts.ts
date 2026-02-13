import { T_getGoodsReceipts } from "../types/api/T_getGoodsReceipts";
import { goodsReceiptRepository } from "../src/repositories/goods-receipt.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getGoodsReceipts: T_getGoodsReceipts = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_purchase_order, start_date, end_date } = req.query;

    const { data, total } = await goodsReceiptRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        id_purchase_order: id_purchase_order ? Number(id_purchase_order) : undefined,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
