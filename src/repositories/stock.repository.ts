/**
 * Stock Repository
 * Handles all database operations for Stock entity
 */

import { BaseRepository } from './base.repository';
import { Stock } from '../../types/model/table/Stock';
import { FindManyOptions } from 'typeorm';

export interface StockListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    id_product_type?: number;
}

export class StockRepository extends BaseRepository<Stock> {
    protected entity = Stock;

    /**
     * Find stock by factory and product type
     */
    async findByFactoryAndProduct(id_factory: number, id_product_type: number): Promise<Stock | null> {
        return await Stock.findOne({
            where: { id_factory, id_product_type }
        });
    }

    /**
     * Find all stocks for a factory
     */
    async findByFactory(id_factory: number): Promise<Stock[]> {
        return await Stock.find({
            where: { id_factory },
            relations: ['otm_id_product_type', 'otm_id_factory']
        });
    }

    /**
     * Find all stocks with filtering
     */
    async findWithFilters(params: StockListParams): Promise<{ stocks: Stock[], total: number }> {
        const options: FindManyOptions<Stock> = {
            take: params.limit || 10,
            skip: params.offset || 0,
            order: { id: 'DESC' },
            relations: ['otm_id_product_type', 'otm_id_factory']
        };

        const where: any = {};

        if (params.id_factory) {
            where.id_factory = params.id_factory;
        }

        if (params.id_product_type) {
            where.id_product_type = params.id_product_type;
        }

        if (Object.keys(where).length > 0) {
            options.where = where;
        }

        const [stocks, total] = await Stock.findAndCount(options);
        return { stocks, total };
    }

    /**
     * Update stock quantity
     */
    async updateQuantity(id: number, quantity: number): Promise<Stock | null> {
        const stock = await this.findById(id);
        if (!stock) return null;

        stock.quantity = quantity;
        stock.updated_at = new Date();
        await stock.save();
        return stock;
    }

    /**
     * Increment stock quantity
     */
    async incrementQuantity(id: number, amount: number): Promise<Stock | null> {
        const stock = await this.findById(id);
        if (!stock) return null;

        stock.quantity = Number(stock.quantity) + amount;
        stock.updated_at = new Date();
        await stock.save();
        return stock;
    }

    /**
     * Decrement stock quantity
     */
    async decrementQuantity(id: number, amount: number): Promise<Stock | null> {
        const stock = await this.findById(id);
        if (!stock) return null;

        stock.quantity = Number(stock.quantity) - amount;
        stock.updated_at = new Date();
        await stock.save();
        return stock;
    }

    /**
     * Create or get stock for factory and product
     */
    async getOrCreate(id_factory: number, id_product_type: number, unit: string): Promise<Stock> {
        let stock = await this.findByFactoryAndProduct(id_factory, id_product_type);

        if (!stock) {
            stock = new Stock();
            stock.id_factory = id_factory;
            stock.id_product_type = id_product_type;
            stock.quantity = 0;
            stock.unit = unit;
            await stock.save();
        }

        return stock;
    }
}

// Singleton instance
export const stockRepository = new StockRepository();
