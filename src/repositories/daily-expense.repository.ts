import { BaseRepository } from './base.repository';
import { DailyExpense } from '@prisma/client';

export class DailyExpenseRepository extends BaseRepository<DailyExpense> {
    protected modelName = 'DailyExpense';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.start_date || params.end_date) {
            where.expense_date = {};
            if (params.start_date) where.expense_date.gte = new Date(params.start_date);
            if (params.end_date) where.expense_date.lte = new Date(params.end_date);
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                include: {
                    ExpenseCategory: true,
                    Factory: true,
                    User: { select: { id: true, fullname: true } }
                },
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { expense_date: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const dailyExpenseRepository = new DailyExpenseRepository();
