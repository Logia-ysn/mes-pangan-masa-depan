
import { T_deleteStock } from "../types/api/T_deleteStock";
import { apiWrapper } from "../src/utils/apiWrapper";
import { stockRepository } from "../src/repositories/stock.repository";
import { stockMovementRepository } from "../src/repositories/stock-movement.repository";
import { requireAuth } from "../utility/auth";

export const t_deleteStock: T_deleteStock = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const id = Number(req.params.id);

    const stock = await stockRepository.findById(id);
    if (!stock) {
        throw new Error('Stock not found');
    }

    // Check for existing movements
    const movementCount = await stockMovementRepository.count({ where: { id_stock: id } });
    if (movementCount > 0) {
        throw new Error(`Cannot delete stock. It has ${movementCount} transaction records. Please delete the transactions first.`);
    }

    await stockRepository.delete(id);

    return {
        status: "success",
        message: "Stock deleted successfully"
    };
});
