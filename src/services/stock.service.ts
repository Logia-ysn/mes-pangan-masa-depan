/**
 * Stock Service
 * Handles stock management business logic
 * 
 * RULES:
 * - No HTTP request/response objects
 * - No direct database queries (use repositories)
 * - Pure business logic only
 */

import { Stock } from '../../types/model/table/Stock';
import { stockRepository } from '../repositories/stock.repository';
import { stockMovementRepository } from '../repositories/stock-movement.repository';
import { productTypeRepository } from '../repositories/product-type.repository';
import { MovementType } from '../../types/model/enum/MovementType';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

export interface UpdateStockDTO {
    factoryId: number;
    productCode: string;
    quantity: number;
    movementType: MovementType;
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
    async getStockByFactoryAndProduct(factoryId: number, productCode: string): Promise<Stock | null> {
        const productType = await productTypeRepository.findByCode(productCode);
        if (!productType) {
            return null;
        }
        return await stockRepository.findByFactoryAndProduct(factoryId, productType.id);
    }

    /**
     * Get all stocks for a factory
     */
    async getStocksByFactory(factoryId: number): Promise<Stock[]> {
        return await stockRepository.findByFactory(factoryId);
    }

    /**
     * Update stock quantity and create movement record
     * This is the core business logic for stock management
     */
    async updateStock(dto: UpdateStockDTO): Promise<Stock | null> {
        if (dto.quantity <= 0) {
            return null;
        }

        // Find product type by code
        const productType = await productTypeRepository.findByCode(dto.productCode);
        if (!productType) {
            console.warn(`ProductType ${dto.productCode} not found, skipping stock update`);
            return null;
        }

        // Get or create stock
        const stock = await stockRepository.getOrCreate(
            dto.factoryId,
            productType.id,
            productType.unit
        );

        // Calculate new quantity
        let newQuantity: number;
        if (dto.movementType === MovementType.OUT) {
            newQuantity = Number(stock.quantity) - dto.quantity;

            // Business rule: Cannot have negative stock (optional - can be configured)
            // if (newQuantity < 0) {
            //     throw new BusinessRuleError(`Insufficient stock for ${dto.productCode}`);
            // }
        } else {
            newQuantity = Number(stock.quantity) + dto.quantity;
        }

        // Update stock
        await stockRepository.updateQuantity(stock.id, newQuantity);

        // Create movement record
        await stockMovementRepository.createMovement({
            id_stock: stock.id,
            id_user: dto.userId,
            movement_type: dto.movementType,
            quantity: dto.quantity,
            reference_type: dto.referenceType,
            reference_id: dto.referenceId,
            notes: dto.notes || JSON.stringify({
                type: dto.movementType === MovementType.OUT ? 'STOCK_OUT' : 'STOCK_IN',
                productCode: dto.productCode
            })
        });

        // Return updated stock
        return await stockRepository.findById(stock.id);
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
        referenceId?: number
    ): Promise<Stock | null> {
        return await this.updateStock({
            factoryId,
            productCode,
            quantity,
            movementType: MovementType.IN,
            userId,
            referenceType,
            referenceId
        });
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
        referenceId?: number
    ): Promise<Stock | null> {
        return await this.updateStock({
            factoryId,
            productCode,
            quantity,
            movementType: MovementType.OUT,
            userId,
            referenceType,
            referenceId
        });
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
     * Transfer stock between factories
     */
    async transferStock(
        fromFactoryId: number,
        toFactoryId: number,
        productCode: string,
        quantity: number,
        userId: number
    ): Promise<{ from: Stock | null; to: Stock | null }> {
        // Check sufficient stock
        if (!await this.hasSufficientStock(fromFactoryId, productCode, quantity)) {
            throw new BusinessRuleError(`Insufficient stock for transfer: ${productCode}`);
        }

        // Remove from source
        const from = await this.removeStock(
            fromFactoryId,
            productCode,
            quantity,
            userId,
            'TRANSFER',
            toFactoryId
        );

        // Add to destination
        const to = await this.addStock(
            toFactoryId,
            productCode,
            quantity,
            userId,
            'TRANSFER',
            fromFactoryId
        );

        return { from, to };
    }
}

// Singleton instance
export const stockService = new StockService();
