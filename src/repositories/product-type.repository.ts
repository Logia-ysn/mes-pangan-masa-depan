/**
 * Product Type Repository
 * Handles all database operations for ProductType entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { ProductType } from '@prisma/client';

export interface ProductTypeListParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export class ProductTypeRepository extends BaseRepository<ProductType> {
    protected modelName = 'ProductType';

    /**
     * Find product type by code
     */
    async findByCode(code: string): Promise<ProductType | null> {
        return await this.model.findFirst({
            where: { code }
        });
    }

    /**
     * Find all product types with filtering
     */
    async findWithFilters(params: ProductTypeListParams): Promise<{ productTypes: ProductType[], total: number }> {
        const where: any = {};

        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } }
            ];
        }

        const [productTypes, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: { id: 'asc' }
            }),
            this.model.count({ where })
        ]);

        return { productTypes, total };
    }

    /**
     * Check if code exists
     */
    async codeExists(code: string, excludeId?: number): Promise<boolean> {
        const productType = await this.model.findFirst({
            where: { code }
        });
        if (!productType) return false;
        if (excludeId && productType.id === excludeId) return false;
        return true;
    }
}

// Singleton instance
export const productTypeRepository = new ProductTypeRepository();
