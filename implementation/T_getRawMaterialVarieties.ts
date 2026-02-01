import { T_getRawMaterialVarieties } from "../types/api/T_getRawMaterialVarieties";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { getUserFromToken } from "../utility/auth";

export const t_getRawMaterialVarieties: T_getRawMaterialVarieties = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { limit = 100, offset = 0, is_active } = req.query;
    const where: any = {};
    if (is_active !== undefined) where.is_active = is_active;
    const [data, total] = await RawMaterialVariety.findAndCount({ where, take: limit, skip: offset, order: { name: 'ASC' } });
    return { data, total };
}
