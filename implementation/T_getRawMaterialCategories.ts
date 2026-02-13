
import { T_getRawMaterialCategories } from "../types/api/T_getRawMaterialCategories";
import { requireAuth } from "../utility/auth";
import { rawMaterialCategoryRepository } from "../src/repositories/raw-material-category.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getRawMaterialCategories: T_getRawMaterialCategories = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, is_active } = req.query;

    const { data, total } = await rawMaterialCategoryRepository.findWithFilters({
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });

    return { data: data as any, total };
});
