import { T_getFactories } from "../types/api/T_getFactories";
import { Factory } from "../types/model/table/Factory";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getFactories: T_getFactories = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const { limit = 10, offset = 0, search } = req.query;

  const where: any = {};

  if (search) {
    where.name = Like(`%${search}%`);
  }

  const [data, total] = await Factory.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { created_at: 'DESC' }
  });

  return { data, total };
}
