import { T_deleteDailyExpense } from "../types/api/T_deleteDailyExpense";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { getUserFromToken } from "../utility/auth";

export const t_deleteDailyExpense: T_deleteDailyExpense = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const expense = await DailyExpense.findOne({ where: { id: req.path.id } });
  if (!expense) throw new Error('Daily expense not found');
  await expense.remove();
  return { message: 'Daily expense deleted successfully', success: true };
}
