import { T_createStockOpname } from "../types/api/T_createStockOpname";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { prisma } from "../src/libs/prisma";
import { Prisma } from "@prisma/client";

export const t_createStockOpname: T_createStockOpname = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_factory, opname_date, notes, items } = req.body;

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create the opname record
        const opname = await tx.stockOpname.create({
            data: {
                id_factory: Number(id_factory),
                id_user: user.id,
                opname_date: new Date(opname_date),
                status: 'COMPLETED',
                notes: notes,
                StockOpnameItem: {
                    create: items.map((item: any) => {
                        const difference = Number(item.actual_quantity) - Number(item.system_quantity);
                        return {
                            id_stock: Number(item.id_stock),
                            system_quantity: Number(item.system_quantity),
                            actual_quantity: Number(item.actual_quantity),
                            difference: Number(difference),
                            notes: item.notes
                        };
                    })
                }
            }
        });

        // Loop items to update stock + create stock movement for differences
        for (const item of items) {
            const difference = Number(item.actual_quantity) - Number(item.system_quantity);

            if (difference !== 0) {
                // Determine movement type based on whether difference is positive (gaining stock) or negative (losing stock)
                // In ERP, adjustment movements usually refer to a change.
                const movType = difference > 0 ? 'IN' : 'OUT';
                // However the request asks for ADJUSTMENT type for clarity. We will use ADJUSTMENT.

                await tx.stockMovement.create({
                    data: {
                        id_stock: Number(item.id_stock),
                        id_user: user.id,
                        movement_type: 'ADJUSTMENT',
                        quantity: Math.abs(difference),
                        reference_type: 'STOCK_OPNAME',
                        reference_id: opname.id,
                        notes: `Stock adjustment from opname (System: ${item.system_quantity}, Actual: ${item.actual_quantity})`
                    }
                });

                // Update actual stock
                await tx.stock.update({
                    where: { id: Number(item.id_stock) },
                    data: {
                        quantity: Number(item.actual_quantity)
                    }
                });
            }
        }

        return opname;
    });

    return created as any;
});
