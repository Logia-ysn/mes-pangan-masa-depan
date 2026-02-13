
import { BaseRepository } from './base.repository';
import { RawMaterialVariety } from '@prisma/client';

export class RawMaterialVarietyRepository extends BaseRepository<RawMaterialVariety> {
    protected modelName = 'RawMaterialVariety';

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

export const rawMaterialVarietyRepository = new RawMaterialVarietyRepository();
