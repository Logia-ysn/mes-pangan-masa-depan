
import { T_deleteEmployee } from "../types/api/T_deleteEmployee";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { employeeRepository } from "../src/repositories/employee.repository";

export const t_deleteEmployee: T_deleteEmployee = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');
  const employee = await employeeRepository.findById(req.path.id);
  if (!employee) throw new Error('Employee not found');
  await employeeRepository.delete(req.path.id);
  return { message: 'Employee deleted successfully', success: true };
});
