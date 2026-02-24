import { BaseRepository } from './base.repository';
import { MaterialReceipt } from '@prisma/client';
import { prisma } from '../libs/prisma';

export class MaterialReceiptRepository extends BaseRepository<MaterialReceipt> {
    protected modelName = 'MaterialReceipt';

    // Include relations lengkap
    private fullInclude = {
        StockMovement: {
            include: {
                Stock: { include: { Factory: true, ProductType: true } },
                RawMaterialQualityAnalysis: true
            }
        },
        Supplier: true,
        Factory: true,
        User: { select: { id: true, fullname: true, email: true, role: true } },
        ProductType: true,
        Approver: { select: { id: true, fullname: true, email: true, role: true } },
        PaidByUser: { select: { id: true, fullname: true, email: true, role: true } }
    };

    async findById(id: number) {
        return prisma.materialReceipt.findUnique({
            where: { id },
            include: this.fullInclude
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_supplier?: number;
        status?: any;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.id_supplier) where.id_supplier = Number(params.id_supplier);
        if (params.status) where.status = params.status;
        if (params.start_date || params.end_date) {
            where.receipt_date = {};
            if (params.start_date) where.receipt_date.gte = new Date(params.start_date);
            if (params.end_date) where.receipt_date.lte = new Date(params.end_date);
        }

        const [data, total] = await Promise.all([
            prisma.materialReceipt.findMany({
                where,
                include: this.fullInclude,
                take: params.limit ? Number(params.limit) : 20,
                skip: params.offset ? Number(params.offset) : 0,
                orderBy: { created_at: 'desc' }
            }),
            prisma.materialReceipt.count({ where })
        ]);

        return { data, total };
    }
}

export const materialReceiptRepository = new MaterialReceiptRepository();
