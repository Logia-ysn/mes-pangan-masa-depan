import { T_getGoodsReceipt } from "../types/api/T_getGoodsReceipt";
import { goodsReceiptRepository } from "../src/repositories/goods-receipt.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { NotFoundError } from "../src/utils/errors";

export const t_getGoodsReceipt: T_getGoodsReceipt = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const id = Number(req.path.id);

    const receipt = await goodsReceiptRepository.findById(id);
    if (!receipt) {
        throw new NotFoundError('GoodsReceipt', id);
    }

    return receipt as any;
});
