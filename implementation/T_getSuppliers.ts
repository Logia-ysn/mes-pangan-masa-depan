import { T_getSuppliers } from "../types/api/T_getSuppliers";
import { Supplier } from "../types/model/table/Supplier";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getSuppliers: T_getSuppliers = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { limit = 100, offset = 0, search, is_active } = req.query;
    const where: any = {};
    if (search) where.name = Like(`%${search}%`);
    if (is_active !== undefined) where.is_active = is_active;
    const [data, total] = await Supplier.findAndCount({ where, take: limit, skip: offset, order: { name: 'ASC' } });
    return { data, total };
}
