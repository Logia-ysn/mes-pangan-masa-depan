import { T_getProductTypes } from "../types/api/T_getProductTypes";
import { ProductType } from "../types/model/table/ProductType";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getProductTypes: T_getProductTypes = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const { limit = 10, offset = 0, search } = req.query;

  const where: any = {};
  if (search) {
    where.name = Like(`%${search}%`);
  }

  const [data, total] = await ProductType.findAndCount({
    where,
    take: limit,
    skip: offset
  });

  return { data, total };
}
