/**
 * Factory Repository
 * Handles all database operations for Factory entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Factory } from '@prisma/client';

export interface FactoryListParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export class FactoryRepository extends BaseRepository<Factory> {
    protected modelName = 'Factory';

    /**
     * Find factory by code
     */
    async findByCode(code: string): Promise<Factory | null> {
        return await this.model.findFirst({
            where: { code }
        });
    }

    /**
     * Find all factories with filtering
     */
    async findWithFilters(params: FactoryListParams): Promise<{ factories: Factory[], total: number }> {
        const where: any = {};

        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } }
            ];
        }

        const [factories, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { id: 'asc' }
            }),
            this.model.count({ where })
        ]);

        return { factories, total };
    }

    /**
     * Check if code exists
     */
    async codeExists(code: string, excludeId?: number): Promise<boolean> {
        const factory = await this.model.findFirst({
            where: { code }
        });
        if (!factory) return false;
        if (excludeId && factory.id === excludeId) return false;
        return true;
    }
}

// Singleton instance
export const factoryRepository = new FactoryRepository();
