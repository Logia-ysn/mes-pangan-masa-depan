import { T_getDailyExpenses } from "../types/api/T_getDailyExpenses";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getDailyExpenses: T_getDailyExpenses = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_factory, id_expense_category, start_date, end_date } = req.query;
  const where: any = {};
  if (id_factory) where.id_factory = id_factory;
  if (id_expense_category) where.id_expense_category = id_expense_category;
  if (start_date && end_date) where.expense_date = Between(start_date, end_date);
  else if (start_date) where.expense_date = MoreThanOrEqual(start_date);
  else if (end_date) where.expense_date = LessThanOrEqual(end_date);
  const [data, total] = await DailyExpense.findAndCount({ where, take: limit, skip: offset, order: { expense_date: 'DESC' } });
  return { data, total };
}
