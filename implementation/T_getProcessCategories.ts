
import { T_getProcessCategories } from "../types/api/T_getProcessCategories";
import { requireAuth } from "../utility/auth";
import { processCategoryRepository } from "../src/repositories/process-category.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getProcessCategories: T_getProcessCategories = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const { is_main_process, is_active } = req.query;

    const { data, total } = await processCategoryRepository.findWithFilters({
        is_main_process: is_main_process !== undefined ? Boolean(is_main_process) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });

    return { data: data as any, total };
});
