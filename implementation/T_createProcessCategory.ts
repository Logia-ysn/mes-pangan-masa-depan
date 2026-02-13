
import { T_createProcessCategory } from "../types/api/T_createProcessCategory";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { processCategoryRepository } from "../src/repositories/process-category.repository";

export const t_createProcessCategory: T_createProcessCategory = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');

    const { code, name, description, is_main_process, display_order } = req.body;

    // Check for existing code
    const existing = await processCategoryRepository.findByCode(code);
    if (existing) throw new Error('Process category code already exists');

    return await processCategoryRepository.create({
        code,
        name,
        description,
        is_main_process: is_main_process ?? true,
        display_order: display_order ?? 0,
        is_active: true
    });
});
