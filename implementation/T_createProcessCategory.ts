import { T_createProcessCategory } from "../types/api/T_createProcessCategory";
import { ProcessCategory } from "../types/model/table/ProcessCategory";
import { getUserFromToken } from "../utility/auth";

export const t_createProcessCategory: T_createProcessCategory = async (req, res) => {
    await getUserFromToken(req.headers.authorization);

    const { code, name, description, is_main_process, display_order } = req.body;

    // Check for existing code
    const existing = await ProcessCategory.findOne({ where: { code } });
    if (existing) throw new Error('Process category code already exists');

    const category = new ProcessCategory();
    category.code = code;
    category.name = name;
    category.description = description;
    category.is_main_process = is_main_process ?? true;
    category.display_order = display_order ?? 0;
    category.is_active = true;

    await category.save();
    return category;
}
