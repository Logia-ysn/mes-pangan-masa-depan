/**
 * Factory Repository
 * Handles all database operations for Factory entity
 */

import { BaseRepository } from './base.repository';
import { Factory } from '../../types/model/table/Factory';
import { FindManyOptions, Like } from 'typeorm';

export interface FactoryListParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export class FactoryRepository extends BaseRepository<Factory> {
    protected entity = Factory;

    /**
     * Find factory by code
     */
    async findByCode(code: string): Promise<Factory | null> {
        return await Factory.findOne({
            where: { code }
        });
    }

    /**
     * Find all factories with filtering
     */
    async findWithFilters(params: FactoryListParams): Promise<{ factories: Factory[], total: number }> {
        const options: FindManyOptions<Factory> = {
            take: params.limit || 10,
            skip: params.offset || 0,
            order: { id: 'ASC' }
        };

        if (params.search) {
            options.where = [
                { name: Like(`%${params.search}%`) },
                { code: Like(`%${params.search}%`) }
            ];
        }

        const [factories, total] = await Factory.findAndCount(options);
        return { factories, total };
    }

    /**
     * Check if code exists
     */
    async codeExists(code: string, excludeId?: number): Promise<boolean> {
        const factory = await Factory.findOne({ where: { code } });
        if (!factory) return false;
        if (excludeId && factory.id === excludeId) return false;
        return true;
    }
}

// Singleton instance
export const factoryRepository = new FactoryRepository();
