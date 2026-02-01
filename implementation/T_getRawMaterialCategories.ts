import { T_getRawMaterialCategories } from "../types/api/T_getRawMaterialCategories";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { getUserFromToken } from "../utility/auth";

export const t_getRawMaterialCategories: T_getRawMaterialCategories = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { limit = 100, offset = 0, is_active } = req.query;
    const where: any = {};
    if (is_active !== undefined) where.is_active = is_active;
    const [data, total] = await RawMaterialCategory.findAndCount({ where, take: limit, skip: offset, order: { name: 'ASC' } });
    return { data, total };
}
