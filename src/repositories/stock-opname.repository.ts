import { BaseRepository } from './base.repository';
import { StockOpname } from '@prisma/client';

export class StockOpnameRepository extends BaseRepository<StockOpname> {
    protected modelName = 'StockOpname';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.status) where.status = params.status;
        if (params.start_date || params.end_date) {
            where.opname_date = {};
            if (params.start_date) where.opname_date.gte = new Date(params.start_date);
            if (params.end_date) where.opname_date.lte = new Date(params.end_date);
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                include: {
                    Factory: { select: { id: true, code: true, name: true } },
                    User: { select: { id: true, fullname: true } },
                    StockOpnameItem: {
                        include: {
                            Stock: {
                                include: {
                                    ProductType: { select: { name: true, category: true } }
                                }
                            }
                        }
                    }
                },
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: [{ opname_date: 'desc' }, { created_at: 'desc' }]
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const stockOpnameRepository = new StockOpnameRepository();
