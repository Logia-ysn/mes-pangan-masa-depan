import { T_deleteExpenseCategory } from "../types/api/T_deleteExpenseCategory";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";

export const t_deleteExpenseCategory: T_deleteExpenseCategory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const category = await ExpenseCategory.findOne({ where: { id: req.path.id } });
  if (!category) throw new Error('Expense category not found');
  await category.remove();
  return { message: 'Expense category deleted successfully', success: true };
}
