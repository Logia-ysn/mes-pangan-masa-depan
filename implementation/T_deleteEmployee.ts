import { T_deleteEmployee } from "../types/api/T_deleteEmployee";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";

export const t_deleteEmployee: T_deleteEmployee = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const employee = await Employee.findOne({ where: { id: req.path.id } });
  if (!employee) throw new Error('Employee not found');
  await employee.remove();
  return { message: 'Employee deleted successfully', success: true };
}
