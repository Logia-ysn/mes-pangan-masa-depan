/**
 * Worksheet Stock Service
 * Extracted from worksheet.service.ts — handles all stock movements during production
 * 
 * Responsibilities:
 * - Input batch stock OUT (on approve)
 * - Output product stock IN (on approve) 
 * - Side product stock IN (on approve)
 * - Stock reversal (on cancel of approved worksheet)
 */

import {
    Worksheet,
    WorksheetInputBatch,
    WorksheetSideProduct,
    StockMovement_movement_type_enum,
    Prisma
} from '@prisma/client';
import { PROCESS_STEPS } from '../worksheet.constants';
import type { StockMovementParams } from '../worksheet.types';

/** Input batch with Stock relation populated */
interface InputBatchWithStock extends WorksheetInputBatch {
    Stock?: {
        id: number;
        quantity: number | Prisma.Decimal;
        ProductType?: { id: number; code: string; name: string };
    };
}

/** Side product with batch_code from JSON data */
type SideProductWithBatch = WorksheetSideProduct & {
    batch_code: string | null;
};

export class WorksheetStockService {
    /**
     * Process input batch stock OUT during approval
     * Validates stock availability before deducting
     */
    async processInputStockOut(
        tx: Prisma.TransactionClient,
        worksheet: Worksheet,
        inputBatches: InputBatchWithStock[],
        userId: number
    ): Promise<void> {
        // Safety: Validate ALL stock availability FIRST
        for (const batch of inputBatches) {
            if (batch.Stock) {
                const currentQty = Number(batch.Stock.quantity);
                const neededQty = Number(batch.quantity);
                if (currentQty < neededQty) {
                    const productName = batch.Stock.ProductType?.name || 'Produk';
                    throw new Error(
                        `Stok ${productName} (${batch.batch_code}) tidak cukup untuk approval. ` +
                        `Tersedia: ${currentQty.toLocaleString()}, Dibutuhkan: ${neededQty.toLocaleString()}`
                    );
                }
            }
        }

        // Deduct stock for each input batch
        for (const batch of inputBatches) {
            if (batch.Stock?.ProductType) {
                await this.createMovement(tx, {
                    stockId: batch.id_stock,
                    userId,
                    type: StockMovement_movement_type_enum.OUT,
                    quantity: Number(batch.quantity),
                    referenceType: 'WORKSHEET',
                    referenceId: worksheet.id,
                    notes: JSON.stringify({
                        type: 'PRODUCTION_INPUT_BATCH',
                        productCode: batch.Stock.ProductType.code,
                        batch_id: batch.id,
                        output_batch_code: worksheet.batch_code,
                        input_batch_code: batch.batch_code
                    }),
                    batchCode: batch.batch_code || null
                });
            }
        }
    }

    /**
     * Process output stocks IN during approval
     * Handles both main output and side products
     */
    async processOutputStockIn(
        tx: Prisma.TransactionClient,
        worksheet: Worksheet,
        userId: number,
        sideProducts: WorksheetSideProduct[]
    ): Promise<void> {
        // 1. Main Output
        let outputCode = '';
        if (worksheet.id_output_product && Number(worksheet.beras_output) > 0) {
            const op = await tx.productType.findUnique({ where: { id: worksheet.id_output_product } });
            if (op) outputCode = op.code;
        } else if (Number(worksheet.beras_output) > 0) {
            outputCode = worksheet.process_step === PROCESS_STEPS.DRYING ? 'GKG' :
                worksheet.process_step === PROCESS_STEPS.HUSKING ? 'PK' :
                    worksheet.process_step === PROCESS_STEPS.STONE_POLISHING ? 'GLOSOR' : 'BRS-P';
        }

        if (outputCode) {
            const pt = await tx.productType.findFirst({ where: { code: outputCode } });
            if (pt) {
                const stock = await this.findOrCreateStock(tx, worksheet.id_factory, pt.id, pt.unit);
                await this.createMovement(tx, {
                    stockId: stock.id,
                    userId,
                    type: StockMovement_movement_type_enum.IN,
                    quantity: Number(worksheet.beras_output),
                    referenceType: 'WORKSHEET',
                    referenceId: worksheet.id,
                    notes: JSON.stringify({
                        type: 'PRODUCTION_OUTPUT',
                        productCode: outputCode,
                        output_type: 'main',
                        batch_code: worksheet.batch_code
                    }),
                    batchCode: worksheet.batch_code
                });
            }
        }

        // 2. Side Products
        for (const sp of sideProducts) {
            if (Number(sp.quantity) > 0) {
                let pt = null;
                if (sp.id_product_type) {
                    pt = await tx.productType.findUnique({ where: { id: sp.id_product_type } });
                } else {
                    pt = await tx.productType.findFirst({ where: { code: sp.product_code } });
                }

                if (pt) {
                    const stock = await this.findOrCreateStock(tx, worksheet.id_factory, pt.id, pt.unit);
                    await this.createMovement(tx, {
                        stockId: stock.id,
                        userId,
                        type: StockMovement_movement_type_enum.IN,
                        quantity: Number(sp.quantity),
                        referenceType: 'WORKSHEET',
                        referenceId: worksheet.id,
                        notes: JSON.stringify({
                            type: 'PRODUCTION_OUTPUT',
                            productCode: sp.product_code,
                            output_type: 'side_product',
                            batch_code: (sp as SideProductWithBatch).batch_code || worksheet.batch_code
                        }),
                        batchCode: (sp as SideProductWithBatch).batch_code || worksheet.batch_code
                    });
                }
            }
        }
    }

    /**
     * Reverse all stock movements for a worksheet (used when cancelling approved worksheet)
     */
    async reverseAllMovements(tx: Prisma.TransactionClient, worksheetId: number, userId: number): Promise<void> {
        // Reverse IN movements (output stocks)
        const inMovements = await tx.stockMovement.findMany({
            where: {
                reference_type: 'WORKSHEET',
                reference_id: worksheetId,
                movement_type: StockMovement_movement_type_enum.IN
            }
        });

        for (const move of inMovements) {
            await tx.stock.update({
                where: { id: move.id_stock },
                data: { quantity: { decrement: move.quantity } }
            });
            await tx.stockMovement.delete({ where: { id: move.id } });
        }

        // Reverse OUT movements (input stocks — add back)
        const outMovements = await tx.stockMovement.findMany({
            where: {
                reference_type: 'WORKSHEET',
                reference_id: worksheetId,
                movement_type: StockMovement_movement_type_enum.OUT
            }
        });

        for (const move of outMovements) {
            await tx.stock.update({
                where: { id: move.id_stock },
                data: { quantity: { increment: move.quantity } }
            });
            await tx.stockMovement.delete({ where: { id: move.id } });
        }
    }

    // ─── Private Helpers ────────────────────────────────────────

    /**
     * Create a stock movement and update stock quantity atomically
     */
    private async createMovement(tx: Prisma.TransactionClient, params: StockMovementParams): Promise<void> {
        await tx.stockMovement.create({
            data: {
                id_stock: params.stockId,
                id_user: params.userId,
                movement_type: params.type,
                quantity: params.quantity,
                reference_type: params.referenceType,
                reference_id: params.referenceId,
                batch_code: params.batchCode || null,
                notes: params.notes
            }
        });

        await tx.stock.update({
            where: { id: params.stockId },
            data: {
                quantity: params.type === StockMovement_movement_type_enum.IN
                    ? { increment: params.quantity }
                    : { decrement: params.quantity }
            }
        });
    }

    /**
     * Find existing stock or create new one for a factory + product type
     */
    private async findOrCreateStock(
        tx: Prisma.TransactionClient,
        factoryId: number,
        productTypeId: number,
        unit: string
    ) {
        let stock = await tx.stock.findFirst({
            where: { id_factory: factoryId, id_product_type: productTypeId }
        });

        if (!stock) {
            stock = await tx.stock.create({
                data: {
                    id_factory: factoryId,
                    id_product_type: productTypeId,
                    quantity: 0,
                    unit
                }
            });
        }

        return stock;
    }
}

export const worksheetStockService = new WorksheetStockService();
