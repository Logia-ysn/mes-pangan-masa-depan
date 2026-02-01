import { T_getProcessCategories } from "../types/api/T_getProcessCategories";
import { ProcessCategory } from "../types/model/table/ProcessCategory";
import { getUserFromToken } from "../utility/auth";

export const t_getProcessCategories: T_getProcessCategories = async (req, res) => {
    await getUserFromToken(req.headers.authorization);

    const { is_main_process, is_active } = req.query;
    const where: any = {};

    if (is_main_process !== undefined) where.is_main_process = is_main_process;
    if (is_active !== undefined) where.is_active = is_active;
    else where.is_active = true; // Default to active only

    const [data, total] = await ProcessCategory.findAndCount({
        where,
        order: { display_order: 'ASC', name: 'ASC' }
    });

    return { data, total };
}
