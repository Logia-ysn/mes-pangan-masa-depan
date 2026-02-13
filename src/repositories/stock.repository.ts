/**
 * Stock Repository
 * Handles all database operations for Stock entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Stock } from '@prisma/client';

export interface StockListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    id_product_type?: number;
}

export class StockRepository extends BaseRepository<Stock> {
    protected modelName = 'Stock';

    /**
     * Find stock by factory and product type
     */
    async findByFactoryAndProduct(id_factory: number, id_product_type: number): Promise<Stock | null> {
        return await this.model.findFirst({
            where: { id_factory, id_product_type }
        });
    }

    /**
     * Find all stocks for a factory
     */
    async findByFactory(id_factory: number): Promise<Stock[]> {
        return await this.model.findMany({
            where: { id_factory },
            include: {
                ProductType: true,
                Factory: true
            }
        });
    }

    /**
     * Find all stocks with filtering
     */
    async findWithFilters(params: StockListParams): Promise<{ stocks: Stock[], total: number }> {
        const where: any = {};

        if (params.id_factory) {
            where.id_factory = params.id_factory;
        }

        if (params.id_product_type) {
            where.id_product_type = params.id_product_type;
        }

        const [stocks, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { id: 'desc' },
                include: {
                    ProductType: true,
                    Factory: true
                }
            }),
            this.model.count({ where })
        ]);

        return { stocks, total };
    }

    /**
     * Update stock quantity
     */
    async updateQuantity(id: number, quantity: number): Promise<Stock | null> {
        try {
            return await this.model.update({
                where: { id },
                data: {
                    quantity,
                }
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Increment stock quantity
     */
    async incrementQuantity(id: number, amount: number): Promise<Stock | null> {
        try {
            return await this.model.update({
                where: { id },
                data: {
                    quantity: { increment: amount },
                }
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Decrement stock quantity
     */
    async decrementQuantity(id: number, amount: number): Promise<Stock | null> {
        try {
            return await this.model.update({
                where: { id },
                data: {
                    quantity: { decrement: amount },
                }
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Create or get stock for factory and product
     */
    async getOrCreate(id_factory: number, id_product_type: number, unit: string): Promise<Stock> {
        const stock = await this.findByFactoryAndProduct(id_factory, id_product_type);

        if (stock) {
            return stock;
        }

        return await this.model.create({
            data: {
                id_factory,
                id_product_type,
                quantity: 0,
                unit
            }
        });
    }
}

// Singleton instance
export const stockRepository = new StockRepository();
