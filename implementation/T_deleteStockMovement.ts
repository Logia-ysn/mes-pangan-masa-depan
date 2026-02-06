import { T_deleteStockMovement } from "../types/api/T_deleteStockMovement";
import { StockMovement } from "../types/model/table/StockMovement";
import { Stock } from "../types/model/table/Stock";
import { AppDataSource } from "../data-source";
import { RawMaterialQualityAnalysis } from "../types/model/table/RawMaterialQualityAnalysis";

export const t_deleteStockMovement: T_deleteStockMovement = async (req, res) => {
    const { id } = req.params;

    const movement = await StockMovement.findOne({ where: { id } });
    if (!movement) {
        res.status(404);
        throw new Error('Stock Movement not found');
    }

    const stock = await Stock.findOne({ where: { id: movement.id_stock } });

    // Start transaction to ensure data integrity
    await AppDataSource.transaction(async transactionalEntityManager => {
        // Reverse the stock quantity impact
        if (stock) {
            if (movement.movement_type === 'IN') {
                stock.quantity = Number(stock.quantity) - Number(movement.quantity);
            } else if (movement.movement_type === 'OUT') {
                stock.quantity = Number(stock.quantity) + Number(movement.quantity);
            }
            // If ADJUSTMENT, we can't really "revert" simply without history, 
            // but for now we assume we just delete the log. 
            // Or ideally strict ledger shouldn't allow deleting adjustments easily.
            // But for Raw Material Receipt (IN), this logic holds.

            stock.updated_at = new Date();
            await transactionalEntityManager.save(Stock, stock);
        }

        // Delete dependent Quality Analysis first to match FK constraints
        // Delete dependent Quality Analysis first to match FK constraints
        await transactionalEntityManager.delete(RawMaterialQualityAnalysis, { id_stock_movement: id });

        await transactionalEntityManager.remove(StockMovement, movement);
    });

    return { status: "success" };
}
