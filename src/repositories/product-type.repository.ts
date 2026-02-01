/**
 * Product Type Repository
 * Handles all database operations for ProductType entity
 */

import { BaseRepository } from './base.repository';
import { ProductType } from '../../types/model/table/ProductType';
import { FindManyOptions, Like } from 'typeorm';

export interface ProductTypeListParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export class ProductTypeRepository extends BaseRepository<ProductType> {
    protected entity = ProductType;

    /**
     * Find product type by code
     */
    async findByCode(code: string): Promise<ProductType | null> {
        return await ProductType.findOne({
            where: { code }
        });
    }

    /**
     * Find all product types with filtering
     */
    async findWithFilters(params: ProductTypeListParams): Promise<{ productTypes: ProductType[], total: number }> {
        const options: FindManyOptions<ProductType> = {
            take: params.limit || 50,
            skip: params.offset || 0,
            order: { id: 'ASC' }
        };

        if (params.search) {
            options.where = [
                { name: Like(`%${params.search}%`) },
                { code: Like(`%${params.search}%`) }
            ];
        }

        const [productTypes, total] = await ProductType.findAndCount(options);
        return { productTypes, total };
    }

    /**
     * Check if code exists
     */
    async codeExists(code: string, excludeId?: number): Promise<boolean> {
        const productType = await ProductType.findOne({ where: { code } });
        if (!productType) return false;
        if (excludeId && productType.id === excludeId) return false;
        return true;
    }
}

// Singleton instance
export const productTypeRepository = new ProductTypeRepository();
