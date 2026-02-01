import { T_getCustomers } from "../types/api/T_getCustomers";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getCustomers: T_getCustomers = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, search, is_active } = req.query;
  const where: any = {};
  if (search) where.name = Like(`%${search}%`);
  if (is_active !== undefined) where.is_active = is_active;
  const [data, total] = await Customer.findAndCount({ where, take: limit, skip: offset, order: { created_at: 'DESC' } });
  return { data, total };
}
