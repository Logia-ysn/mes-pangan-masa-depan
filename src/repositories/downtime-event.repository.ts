import { prisma } from '../libs/prisma';
import { DowntimeEvent, DowntimeEvent_category_enum, Prisma } from '@prisma/client';

export interface DowntimeEventListParams {
    limit?: number;
    offset?: number;
    id_machine?: number;
    id_factory?: number;
    category?: DowntimeEvent_category_enum;
    status?: string;
    start_date?: Date;
    end_date?: Date;
}

class DowntimeEventRepository {
    private get model() {
        return prisma.downtimeEvent;
    }

    async findById(id: number): Promise<DowntimeEvent | null> {
        return this.model.findUnique({
            where: { id },
            include: {
                Machine: true,
                Factory: true,
                User: true
            }
        });
    }

    async findWithFilters(params: DowntimeEventListParams): Promise<{ downtimeEvents: DowntimeEvent[], total: number }> {
        const where: any = {};
        if (params.id_machine) where.id_machine = Number(params.id_machine);
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.category) where.category = params.category;
        if (params.status) where.status = params.status;

        if (params.start_date || params.end_date) {
            where.start_time = {};
            if (params.start_date) where.start_time.gte = params.start_date;
            if (params.end_date) where.start_time.lte = params.end_date;
        }

        const [downtimeEvents, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { start_time: 'desc' },
                include: {
                    Machine: true,
                    Factory: true,
                    User: true
                }
            }),
            this.model.count({ where })
        ]);

        return { downtimeEvents, total };
    }
}

export const downtimeEventRepository = new DowntimeEventRepository();
