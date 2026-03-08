import { T_getProductionLines } from "../types/api/T_getProductionLines";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineRepository } from "../src/repositories/production-line.repository";

export const t_getProductionLines: T_getProductionLines = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, is_active } = req.query as any;
    return await productionLineRepository.findWithFilters({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        id_factory: id_factory ? Number(id_factory) : undefined,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
    });
});
