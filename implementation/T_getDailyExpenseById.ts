import { T_getDailyExpenseById } from "../types/api/T_getDailyExpenseById";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { getUserFromToken } from "../utility/auth";

export const t_getDailyExpenseById: T_getDailyExpenseById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const expense = await DailyExpense.findOne({ where: { id: req.path.id } });
  if (!expense) throw new Error('Daily expense not found');
  return expense;
}
