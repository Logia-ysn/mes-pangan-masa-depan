import { T_updateDailyExpense } from "../types/api/T_updateDailyExpense";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { getUserFromToken } from "../utility/auth";

export const t_updateDailyExpense: T_updateDailyExpense = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const expense = await DailyExpense.findOne({ where: { id: req.path.id } });
  if (!expense) throw new Error('Daily expense not found');
  const { id_expense_category, expense_date, amount, description, receipt_url } = req.body;
  if (id_expense_category !== undefined) expense.id_expense_category = id_expense_category;
  if (expense_date !== undefined) expense.expense_date = new Date(expense_date);
  if (amount !== undefined) expense.amount = amount;
  if (description !== undefined) expense.description = description;
  if (receipt_url !== undefined) expense.receipt_url = receipt_url;
  expense.updated_at = new Date();
  await expense.save();
  return expense;
}
