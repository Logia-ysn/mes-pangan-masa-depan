import { T_deleteStock } from "../types/api/T_deleteStock";
import { Stock } from "../types/model/table/Stock";
import { StockMovement } from "../types/model/table/StockMovement";

export const t_deleteStock: T_deleteStock = async (req, res) => {
    const { id } = req.params;

    const stock = await Stock.findOne({ where: { id } });
    if (!stock) {
        res.status(404);
        throw new Error('Stock not found');
    }

    // Check for existing movements
    const movementCount = await StockMovement.count({ where: { id_stock: id } });
    if (movementCount > 0) {
        res.status(400);
        throw new Error(`Cannot delete stock. It has ${movementCount} transaction records. Please delete the transactions first.`);
    }

    await stock.remove();

    return {
        status: "success",
        message: "Stock deleted successfully"
    };
}
