import { T_updateExpenseCategory } from "../types/api/T_updateExpenseCategory";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";

export const t_updateExpenseCategory: T_updateExpenseCategory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const category = await ExpenseCategory.findOne({ where: { id: req.path.id } });
  if (!category) throw new Error('Expense category not found');
  const { code, name, description } = req.body;
  if (code !== undefined) category.code = code;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  await category.save();
  return category;
}
