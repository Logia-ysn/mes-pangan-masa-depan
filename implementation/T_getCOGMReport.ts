import { T_getCOGMReport } from "../types/api/T_getCOGMReport";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { Worksheet } from "../types/model/table/Worksheet";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";
import { Between, In } from "typeorm";

export const t_getCOGMReport: T_getCOGMReport = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, start_date, end_date } = req.query;

  const expenseWhere: any = { expense_date: Between(start_date, end_date) };
  const worksheetWhere: any = { worksheet_date: Between(start_date, end_date) };
  if (id_factory) {
    expenseWhere.id_factory = id_factory;
    worksheetWhere.id_factory = id_factory;
  }

  const expenses = await DailyExpense.find({ where: expenseWhere });
  const worksheets = await Worksheet.find({ where: worksheetWhere });

  const total_production_cost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const total_beras_output = worksheets.reduce((sum, w) => sum + Number(w.beras_output), 0);
  const cost_per_kg = total_beras_output > 0 ? total_production_cost / total_beras_output : 0;

  // Breakdown by category
  const categoryIds = [...new Set(expenses.map(e => e.id_expense_category))];
  const categories = categoryIds.length > 0 ? await ExpenseCategory.find({ where: { id: In(categoryIds) } }) : [];
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const breakdownMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    const name = categoryMap.get(e.id_expense_category) || 'Unknown';
    breakdownMap[name] = (breakdownMap[name] || 0) + Number(e.amount);
  });
  const breakdown = Object.entries(breakdownMap).map(([category, amount]) => ({ category, amount }));

  return { total_production_cost, total_beras_output, cost_per_kg, breakdown };
}
