import { BaseRepository } from './base.repository';
import { ProductionLine } from '@prisma/client';

export class ProductionLineRepository extends BaseRepository<ProductionLine> {
    protected modelName = 'ProductionLine';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.is_active !== undefined) where.is_active = params.is_active;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: { id: 'asc' },
                include: {
                    Factory: true,
                    Machine: {
                        orderBy: { sequence_order: 'asc' },
                        include: { Factory: true }
                    },
                    _count: { select: { Machine: true, Worksheet: true } }
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }

    async findByIdWithMachines(id: number): Promise<ProductionLine | null> {
        return await this.model.findUnique({
            where: { id },
            include: {
                Factory: true,
                Machine: {
                    orderBy: { sequence_order: 'asc' },
                    include: { Factory: true }
                },
                _count: { select: { Machine: true, Worksheet: true } }
            }
        });
    }
}

export const productionLineRepository = new ProductionLineRepository();
