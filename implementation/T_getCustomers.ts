import { T_getCustomers } from "../types/api/T_getCustomers";
import { customerRepository } from "../src/repositories/customer.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getCustomers: T_getCustomers = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, search, is_active } = req.query;

    const { data, total } = await customerRepository.findWithFilters({
        limit: limit ? Number(limit) : 10,
        offset: offset ? Number(offset) : 0,
        search: search as string,
        is_active: is_active !== undefined ? String(is_active) === 'true' : undefined
    });

    return { data: data as any, total };
});
