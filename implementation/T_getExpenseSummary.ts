import { T_getExpenseSummary } from "../types/api/T_getExpenseSummary";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";
import { Between, In } from "typeorm";

export const t_getExpenseSummary: T_getExpenseSummary = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, start_date, end_date } = req.query;

  const where: any = { expense_date: Between(start_date, end_date) };
  if (id_factory) where.id_factory = id_factory;

  const expenses = await DailyExpense.find({ where });
  const total_expense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group by category
  const categoryIds = [...new Set(expenses.map(e => e.id_expense_category))];
  const categories = categoryIds.length > 0 ? await ExpenseCategory.find({ where: { id: In(categoryIds) } }) : [];
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const byCategoryMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    const name = categoryMap.get(e.id_expense_category) || 'Unknown';
    byCategoryMap[name] = (byCategoryMap[name] || 0) + Number(e.amount);
  });
  const by_category = Object.entries(byCategoryMap).map(([category_name, total]) => ({ category_name, total }));

  return { total_expense, by_category };
}
