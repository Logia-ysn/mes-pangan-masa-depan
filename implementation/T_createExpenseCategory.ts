import { T_createExpenseCategory } from "../types/api/T_createExpenseCategory";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { getUserFromToken } from "../utility/auth";

export const t_createExpenseCategory: T_createExpenseCategory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { code, name, description } = req.body;
  const existing = await ExpenseCategory.findOne({ where: { code } });
  if (existing) throw new Error('Expense category code already exists');
  const category = new ExpenseCategory();
  category.code = code;
  category.name = name;
  category.description = description;
  await category.save();
  return category;
}
