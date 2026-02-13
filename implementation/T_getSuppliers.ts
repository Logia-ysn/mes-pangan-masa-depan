import { T_getSuppliers } from "../types/api/T_getSuppliers";
import { supplierRepository } from "../src/repositories/supplier.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getSuppliers: T_getSuppliers = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, search, is_active } = req.query;

    const { data, total } = await supplierRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        search: search as string,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });

    return { data: data as any, total };
});
