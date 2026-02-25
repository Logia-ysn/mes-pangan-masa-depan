import { T_getDailyExpenses } from "../types/api/T_getDailyExpenses";
import { dailyExpenseRepository } from "../src/repositories/daily-expense.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getDailyExpenses: T_getDailyExpenses = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, start_date, end_date } = req.query;

    const { data, total } = await dailyExpenseRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        id_factory: id_factory ? Number(id_factory) : undefined,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
