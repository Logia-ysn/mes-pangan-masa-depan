
import { BaseRepository } from './base.repository';
import { Machine, Machine_status_enum } from '@prisma/client';

export class MachineRepository extends BaseRepository<Machine> {
    protected modelName = 'Machine';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        status?: string;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.status) where.status = params.status as Machine_status_enum;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: { id: 'asc' },
                include: {
                    Factory: true,
                    ProductionLine: true
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const machineRepository = new MachineRepository();
