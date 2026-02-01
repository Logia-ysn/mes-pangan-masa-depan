import { T_getExpenseCategoryById } from "../types/api/T_getExpenseCategoryById";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";

export const t_getExpenseCategoryById: T_getExpenseCategoryById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const category = await ExpenseCategory.findOne({ where: { id: req.path.id } });
  if (!category) throw new Error('Expense category not found');
  return category;
}
