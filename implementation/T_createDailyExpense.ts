import { T_createDailyExpense } from "../types/api/T_createDailyExpense";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { getUserFromToken } from "../utility/auth";

export const t_createDailyExpense: T_createDailyExpense = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_factory, id_expense_category, expense_date, amount, description, receipt_url } = req.body;
  const expense = new DailyExpense();
  expense.id_factory = id_factory;
  expense.id_user = user.id;
  expense.id_expense_category = id_expense_category;
  expense.expense_date = new Date(expense_date);
  expense.amount = amount;
  expense.description = description;
  expense.receipt_url = receipt_url;
  await expense.save();
  return expense;
}
