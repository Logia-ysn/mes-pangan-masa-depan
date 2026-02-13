import { BaseRepository } from './base.repository';
import { GoodsReceipt } from '@prisma/client';

export class GoodsReceiptRepository extends BaseRepository<GoodsReceipt> {
    protected modelName = 'GoodsReceipt';

    async findById(id: number) {
        return this.model.findUnique({
            where: { id },
            include: {
                PurchaseOrder: {
                    include: { Supplier: true, Factory: true }
                },
                User: true,
                GoodsReceiptItem: {
                    include: {
                        PurchaseOrderItem: {
                            include: { ProductType: true }
                        }
                    }
                }
            }
        });
    }

    async findByPO(id_purchase_order: number) {
        return this.model.findMany({
            where: { id_purchase_order },
            include: {
                User: true,
                GoodsReceiptItem: {
                    include: {
                        PurchaseOrderItem: {
                            include: { ProductType: true }
                        }
                    }
                }
            },
            orderBy: { receipt_date: 'desc' }
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_purchase_order?: number;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_purchase_order !== undefined) {
            where.id_purchase_order = params.id_purchase_order;
        }
        if (params.start_date || params.end_date) {
            where.receipt_date = {};
            if (params.start_date) {
                where.receipt_date.gte = params.start_date;
            }
            if (params.end_date) {
                where.receipt_date.lte = params.end_date;
            }
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                include: {
                    PurchaseOrder: { include: { Supplier: true } },
                    User: true,
                    GoodsReceiptItem: {
                        include: {
                            PurchaseOrderItem: { include: { ProductType: true } }
                        }
                    }
                },
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { receipt_date: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const goodsReceiptRepository = new GoodsReceiptRepository();
