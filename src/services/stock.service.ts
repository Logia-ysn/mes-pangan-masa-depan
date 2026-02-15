/**
 * Stock Service
 * Handles stock management business logic using Prisma
 */

import { Prisma, Stock, StockMovement_movement_type_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { stockRepository } from '../repositories/stock.repository';
import { productTypeRepository } from '../repositories/product-type.repository';
import { BusinessRuleError } from '../utils/errors';

export interface UpdateStockDTO {
    factoryId: number;
    productCode: string;
    quantity: number;
    movementType: StockMovement_movement_type_enum;
    userId: number;
    referenceType?: string;
    referenceId?: number;
    notes?: string;
}

export interface CreateStockDTO {
    id_factory: number;
    id_product_type: number;
    quantity: number;
    unit: string;
}

class StockService {
    /**
     * Get stock by factory and product code
     */
    async getStockByFactoryAndProduct(factoryId: number, productCode: string, tx?: Prisma.TransactionClient): Promise<Stock | null> {
        const productType = await productTypeRepository.findByCode(productCode);
        if (!productType) {
            return null;
        }
        const db = tx || prisma;
        return await db.stock.findFirst({
            where: { id_factory: factoryId, id_product_type: productType.id }
        });
    }

    /**
     * Get all stocks for a factory
     */
    async getStocksByFactory(factoryId: number): Promise<Stock[]> {
        return await stockRepository.findByFactory(factoryId);
    }

    /**
     * Update stock quantity and create movement record (transactional aware)
     */
    async updateStock(dto: UpdateStockDTO, tx?: Prisma.TransactionClient): Promise<Stock | null> {
        if (dto.quantity <= 0) {
            return null;
        }

        // Find product type by code
        const productType = await productTypeRepository.findByCode(dto.productCode);
        if (!productType) {
            console.warn(`ProductType ${dto.productCode} not found, skipping stock update`);
            return null;
        }

        const logic = async (db: Prisma.TransactionClient) => {
            // Get or create stock within transaction
            let stock = await db.stock.findFirst({
                where: { id_factory: dto.factoryId, id_product_type: productType.id }
            });

            if (!stock) {
                stock = await db.stock.create({
                    data: {
                        id_factory: dto.factoryId,
                        id_product_type: productType.id,
                        quantity: 0,
                        unit: productType.unit
                    }
                });
            }

            // Calculate new quantity
            let newQuantity: number;
            if (dto.movementType === StockMovement_movement_type_enum.OUT) {
                newQuantity = Number(stock.quantity) - dto.quantity;
                if (newQuantity < 0) {
                    throw new BusinessRuleError(
                        `Insufficient stock for ${dto.productCode}. Available: ${stock.quantity}, Requested: ${dto.quantity}`
                    );
                }
            } else {
                newQuantity = Number(stock.quantity) + dto.quantity;
            }

            // Update stock atomically
            const updatedStock = await db.stock.update({
                where: { id: stock.id },
                data: { quantity: newQuantity }
            });

            // Create movement record
            await db.stockMovement.create({
                data: {
                    id_stock: stock.id,
                    id_user: dto.userId,
                    movement_type: dto.movementType,
                    quantity: dto.quantity,
                    reference_type: dto.referenceType,
                    reference_id: dto.referenceId,
                    notes: dto.notes || JSON.stringify({
                        type: dto.movementType === StockMovement_movement_type_enum.OUT ? 'STOCK_OUT' : 'STOCK_IN',
                        productCode: dto.productCode
                    })
                }
            });

            return updatedStock;
        };

        if (tx) {
            return await logic(tx);
        } else {
            return await prisma.$transaction(async (newTx) => {
                return await logic(newTx);
            });
        }
    }

    /**
     * Add stock (IN movement)
     */
    async addStock(
        factoryId: number,
        productCode: string,
        quantity: number,
        userId: number,
        referenceType?: string,
        referenceId?: number,
        tx?: Prisma.TransactionClient
    ): Promise<Stock | null> {
        return await this.updateStock({
            factoryId,
            productCode,
            quantity,
            movementType: StockMovement_movement_type_enum.IN,
            userId,
            referenceType,
            referenceId
        }, tx);
    }

    /**
     * Remove stock (OUT movement)
     */
    async removeStock(
        factoryId: number,
        productCode: string,
        quantity: number,
        userId: number,
        referenceType?: string,
        referenceId?: number,
        tx?: Prisma.TransactionClient
    ): Promise<Stock | null> {
        return await this.updateStock({
            factoryId,
            productCode,
            quantity,
            movementType: StockMovement_movement_type_enum.OUT,
            userId,
            referenceType,
            referenceId
        }, tx);
    }

    /**
     * Get available quantity for a product at a factory
     */
    async getAvailableQuantity(factoryId: number, productCode: string): Promise<number> {
        const stock = await this.getStockByFactoryAndProduct(factoryId, productCode);
        return stock ? Number(stock.quantity) : 0;
    }

    /**
     * Check if sufficient stock is available
     */
    async hasSufficientStock(
        factoryId: number,
        productCode: string,
        requiredQuantity: number
    ): Promise<boolean> {
        const available = await this.getAvailableQuantity(factoryId, productCode);
        return available >= requiredQuantity;
    }

    /**
     * Transfer stock between factories (single transaction)
     */
    async transferStock(
        fromFactoryId: number,
        toFactoryId: number,
        productCode: string,
        quantity: number,
        userId: number,
        notes?: string
    ): Promise<{ from: Stock | null; to: Stock | null }> {
        const productType = await productTypeRepository.findByCode(productCode);
        if (!productType) {
            throw new BusinessRuleError(`Product type not found: ${productCode}`);
        }

        return await prisma.$transaction(async (tx) => {
            // Source stock
            const sourceStock = await tx.stock.findFirst({
                where: { id_factory: fromFactoryId, id_product_type: productType.id }
            });

            if (!sourceStock || Number(sourceStock.quantity) < quantity) {
                throw new BusinessRuleError(
                    `Insufficient stock for transfer: ${productCode}. Available: ${sourceStock?.quantity ?? 0}, Requested: ${quantity}`
                );
            }

            // Destination stock (get or create)
            let destStock = await tx.stock.findFirst({
                where: { id_factory: toFactoryId, id_product_type: productType.id }
            });

            if (!destStock) {
                destStock = await tx.stock.create({
                    data: {
                        id_factory: toFactoryId,
                        id_product_type: productType.id,
                        quantity: 0,
                        unit: productType.unit
                    }
                });
            }

            // Deduct from source
            const from = await tx.stock.update({
                where: { id: sourceStock.id },
                data: { quantity: { decrement: quantity } }
            });

            // Add to destination
            const to = await tx.stock.update({
                where: { id: destStock.id },
                data: { quantity: { increment: quantity } }
            });

            // Create movement records
            await tx.stockMovement.create({
                data: {
                    id_stock: sourceStock.id,
                    id_user: userId,
                    movement_type: StockMovement_movement_type_enum.OUT,
                    quantity,
                    reference_type: 'TRANSFER',
                    reference_id: toFactoryId,
                    notes: JSON.stringify({
                        type: 'TRANSFER_OUT',
                        productCode,
                        toFactory: toFactoryId,
                        userNotes: notes || ''
                    })
                }
            });

            await tx.stockMovement.create({
                data: {
                    id_stock: destStock.id,
                    id_user: userId,
                    movement_type: StockMovement_movement_type_enum.IN,
                    quantity,
                    reference_type: 'TRANSFER',
                    reference_id: fromFactoryId,
                    notes: JSON.stringify({
                        type: 'TRANSFER_IN',
                        productCode,
                        fromFactory: fromFactoryId,
                        userNotes: notes || ''
                    })
                }
            });

            return { from, to };
        });
    }
}

// Singleton instance
export const stockService = new StockService();
