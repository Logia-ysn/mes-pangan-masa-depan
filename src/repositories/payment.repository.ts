import { BaseRepository } from './base.repository';
import { Payment } from '@prisma/client';

export class PaymentRepository extends BaseRepository<Payment> {
    protected modelName = 'Payment';

    async findByInvoice(id_invoice: number) {
        return this.model.findMany({
            where: { id_invoice },
            include: { User: true },
            orderBy: { payment_date: 'desc' }
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_invoice?: number;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_invoice !== undefined) {
            where.id_invoice = params.id_invoice;
        }
        if (params.payment_method) {
            where.payment_method = params.payment_method;
        }
        if (params.start_date || params.end_date) {
            where.payment_date = {};
            if (params.start_date) {
                where.payment_date.gte = params.start_date;
            }
            if (params.end_date) {
                where.payment_date.lte = params.end_date;
            }
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { created_at: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const paymentRepository = new PaymentRepository();
