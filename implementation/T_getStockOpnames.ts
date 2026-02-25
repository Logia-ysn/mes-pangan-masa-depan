import { T_getStockOpnames } from "../types/api/T_getStockOpnames";
import { stockOpnameRepository } from "../src/repositories/stock-opname.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getStockOpnames: T_getStockOpnames = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, status, start_date, end_date } = req.query;

    const { data, total } = await stockOpnameRepository.findWithFilters({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        id_factory: id_factory ? Number(id_factory) : undefined,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
