import { prisma } from '../libs/prisma';
import { WorkOrder, Prisma } from '@prisma/client';

export interface WorkOrderListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    status?: string;
    priority?: string;
    id_production_line?: number;
    start_date?: Date;
    end_date?: Date;
}

class WorkOrderRepository {
    private get model() {
        return prisma.workOrder;
    }

    async findById(id: number): Promise<WorkOrder | null> {
        return this.model.findUnique({
            where: { id },
            include: {
                Factory: true,
                User: true,
                ProductionLine: true,
                Worksheet: {
                    orderBy: { step_number: 'asc' },
                    include: {
                        User: true,
                        Machine: true,
                        ProductType: true
                    }
                }
            }
        });
    }

    async findWithFilters(params: WorkOrderListParams): Promise<{ workOrders: WorkOrder[], total: number }> {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.status) where.status = params.status;
        if (params.priority) where.priority = params.priority;
        if (params.id_production_line) where.id_production_line = Number(params.id_production_line);

        if (params.start_date || params.end_date) {
            where.created_at = {};
            if (params.start_date) where.created_at.gte = params.start_date;
            if (params.end_date) where.created_at.lte = params.end_date;
        }

        const [workOrders, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { created_at: 'desc' },
                include: {
                    Factory: true,
                    User: true,
                    ProductionLine: true,
                    _count: { select: { Worksheet: true } }
                }
            }),
            this.model.count({ where })
        ]);

        return { workOrders, total };
    }
}

export const workOrderRepository = new WorkOrderRepository();
