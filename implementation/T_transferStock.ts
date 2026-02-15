import { T_transferStock } from "../types/api/T_transferStock";
import { stockService } from "../src/services/stock.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_transferStock: T_transferStock = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');

    const { fromFactoryId, toFactoryId, productCode, quantity, notes } = req.body;

    // Validate different factories
    if (fromFactoryId === toFactoryId) {
        throw new Error('Pabrik asal dan tujuan tidak boleh sama');
    }

    const result = await stockService.transferStock(
        fromFactoryId,
        toFactoryId,
        productCode,
        quantity,
        user.id,
        notes
    );

    return {
        status: 'success',
        message: `Transfer ${quantity} kg ${productCode} berhasil`,
        data: {
            from: {
                factory_id: fromFactoryId,
                product_code: productCode,
                new_quantity: Number(result.from?.quantity || 0)
            },
            to: {
                factory_id: toFactoryId,
                product_code: productCode,
                new_quantity: Number(result.to?.quantity || 0)
            }
        }
    };
});
