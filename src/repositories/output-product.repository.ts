
import { BaseRepository } from './base.repository';
import { OutputProduct } from '@prisma/client';

export class OutputProductRepository extends BaseRepository<OutputProduct> {
    protected modelName = 'OutputProduct';

    async findByFactory(id_factory: number) {
        return await this.model.findMany({
            where: { id_factory, is_active: true },
            orderBy: { display_order: 'asc' }
        });
    }

    async findByCode(id_factory: number, code: string) {
        return await this.model.findFirst({
            where: { id_factory, code }
        });
    }

    async findWithFilters(params: {
        id_factory?: number;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.id_factory !== undefined) where.id_factory = Number(params.id_factory);
        if (params.is_active !== undefined) where.is_active = params.is_active;
        else where.is_active = true;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                orderBy: [
                    { display_order: 'asc' },
                    { name: 'asc' }
                ],
                include: {
                    Factory: true
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const outputProductRepository = new OutputProductRepository();
