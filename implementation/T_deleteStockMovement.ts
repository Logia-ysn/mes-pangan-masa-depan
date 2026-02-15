
import { T_deleteStockMovement } from "../types/api/T_deleteStockMovement";
import { prisma } from "../src/libs/prisma";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteStockMovement: T_deleteStockMovement = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const id = Number(req.params.id);

    const movement = await prisma.stockMovement.findUnique({ where: { id } });
    if (!movement) {
        throw new Error('Stock Movement not found');
    }

    const stock = await prisma.stock.findUnique({ where: { id: movement.id_stock } });

    // Use Prisma transaction
    await prisma.$transaction(async (tx) => {
        // Reverse the stock quantity impact
        if (stock) {
            let newQuantity = Number(stock.quantity);
            if (movement.movement_type === 'IN') {
                newQuantity -= Number(movement.quantity);
                if (newQuantity < 0) {
                    throw new Error(
                        `Cannot reverse: would result in negative stock (${newQuantity})`
                    );
                }
            } else if (movement.movement_type === 'OUT') {
                newQuantity += Number(movement.quantity);
            }

            await tx.stock.update({
                where: { id: stock.id },
                data: {
                    quantity: newQuantity
                }
            });
        }

        // Delete dependent Quality Analysis first to match FK constraints
        await tx.rawMaterialQualityAnalysis.deleteMany({
            where: { id_stock_movement: id }
        });

        await tx.stockMovement.delete({
            where: { id }
        });
    });

    return { status: "success" };
});
