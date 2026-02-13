
import { T_getRawMaterialVarieties } from "../types/api/T_getRawMaterialVarieties";
import { requireAuth } from "../utility/auth";
import { rawMaterialVarietyRepository } from "../src/repositories/raw-material-variety.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getRawMaterialVarieties: T_getRawMaterialVarieties = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, is_active } = req.query;

    const { data, total } = await rawMaterialVarietyRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });

    return { data: data as any, total };
});
