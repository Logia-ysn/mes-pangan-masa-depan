
import { BaseRepository } from './base.repository';
import { RawMaterialCategory } from '@prisma/client';

export class RawMaterialCategoryRepository extends BaseRepository<RawMaterialCategory> {
    protected modelName = 'RawMaterialCategory';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.is_active !== undefined) where.is_active = params.is_active;

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

export const rawMaterialCategoryRepository = new RawMaterialCategoryRepository();
