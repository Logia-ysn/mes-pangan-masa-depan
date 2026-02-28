import { BaseRepository } from './base.repository';
import { PurchaseOrder } from '@prisma/client';

export class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
    protected modelName = 'PurchaseOrder';

    async findById(id: number) {
        return this.model.findUnique({
            where: { id },
            include: {
                Supplier: true,
                Factory: true,
                User: true,
                PurchaseOrderItem: {
                    include: { ProductType: true, GoodsReceiptItem: true }
                },
                GoodsReceipt: {
                    include: {
                        User: true,
                        GoodsReceiptItem: {
                            include: { PurchaseOrderItem: { include: { ProductType: true } } }
                        }
                    },
                    orderBy: { receipt_date: 'desc' }
                }
            }
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_supplier?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory !== undefined) {
            where.id_factory = params.id_factory;
        }
        if (params.id_supplier !== undefined) {
            where.id_supplier = params.id_supplier;
        }
        if (params.status) {
            if (params.status.includes(',')) {
                where.status = { in: params.status.split(',') };
            } else {
                where.status = params.status;
            }
        }
        if (params.start_date || params.end_date) {
            where.order_date = {};
            if (params.start_date) {
                where.order_date.gte = new Date(params.start_date);
            }
            if (params.end_date) {
                where.order_date.lte = new Date(params.end_date);
            }
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                include: {
                    Supplier: true,
                    Factory: true,
                },
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { order_date: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }

    async getStats(id_factory?: number) {
        const baseWhere: any = {};
        if (id_factory !== undefined) {
            baseWhere.id_factory = id_factory;
        }

        const [totalResult, pendingCount, receivedCount] = await Promise.all([
            this.model.aggregate({
                where: baseWhere,
                _sum: { total: true }
            }),
            this.model.count({
                where: { ...baseWhere, status: { in: ['DRAFT', 'APPROVED', 'SENT', 'PARTIAL_RECEIVED'] } }
            }),
            this.model.count({
                where: { ...baseWhere, status: 'RECEIVED' }
            })
        ]);

        return {
            total_amount: totalResult._sum.total || 0,
            pending_count: pendingCount,
            received_count: receivedCount
        };
    }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
