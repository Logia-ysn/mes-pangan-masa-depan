import { BaseRepository } from './base.repository';
import { Invoice } from '@prisma/client';

export class InvoiceRepository extends BaseRepository<Invoice> {
    protected modelName = 'Invoice';

    async findById(id: number) {
        return this.model.findUnique({
            where: { id },
            include: {
                Customer: true,
                Factory: true,
                User: true,
                InvoiceItem: {
                    include: { ProductType: true }
                },
                Payment: true
            }
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_customer?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory !== undefined) {
            where.id_factory = params.id_factory;
        }
        if (params.id_customer !== undefined) {
            where.id_customer = params.id_customer;
        }
        if (params.status) {
            where.status = params.status;
        }
        if (params.start_date || params.end_date) {
            where.invoice_date = {};
            if (params.start_date) {
                where.invoice_date.gte = params.start_date;
            }
            if (params.end_date) {
                where.invoice_date.lte = params.end_date;
            }
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { invoice_date: 'desc' }
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

        const [revenueResult, pendingResult, paid_count] = await Promise.all([
            this.model.aggregate({
                where: { ...baseWhere, status: 'PAID' },
                _sum: { total: true }
            }),
            this.model.aggregate({
                where: { ...baseWhere, status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } },
                _sum: { total: true }
            }),
            this.model.count({
                where: { ...baseWhere, status: 'PAID' }
            })
        ]);

        return {
            total_revenue: revenueResult._sum.total || 0,
            pending_amount: pendingResult._sum.total || 0,
            paid_count
        };
    }
}

export const invoiceRepository = new InvoiceRepository();
