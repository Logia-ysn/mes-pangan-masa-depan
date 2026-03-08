/**
 * Supplier Repository
 * Handles all database operations for Supplier entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Supplier } from '@prisma/client';

export class SupplierRepository extends BaseRepository<Supplier> {
    protected modelName = 'Supplier';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        search?: string;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.search) {
            where.name = { contains: params.search, mode: 'insensitive' };
        }
        if (params.is_active !== undefined) {
            where.is_active = params.is_active;
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { name: 'asc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const supplierRepository = new SupplierRepository();
