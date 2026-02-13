
import { BaseRepository } from './base.repository';
import { ProcessCategory } from '@prisma/client';

export class ProcessCategoryRepository extends BaseRepository<ProcessCategory> {
    protected modelName = 'ProcessCategory';

    async findByCode(code: string) {
        return await this.model.findUnique({
            where: { code }
        });
    }

    async findWithFilters(params: {
        is_main_process?: boolean;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.is_main_process !== undefined) where.is_main_process = params.is_main_process;
        if (params.is_active !== undefined) where.is_active = params.is_active;
        else where.is_active = true;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                orderBy: [
                    { display_order: 'asc' },
                    { name: 'asc' }
                ]
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const processCategoryRepository = new ProcessCategoryRepository();
