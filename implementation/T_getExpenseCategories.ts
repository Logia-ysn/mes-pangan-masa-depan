import { T_getExpenseCategories } from "../types/api/T_getExpenseCategories";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getExpenseCategories: T_getExpenseCategories = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, search } = req.query;
  const where: any = {};
  if (search) where.name = Like(`%${search}%`);
  const [data, total] = await ExpenseCategory.findAndCount({ where, take: limit, skip: offset });
  return { data, total };
}
