
import { T_getEmployeeById } from "../types/api/T_getEmployeeById";
import { requireAuth } from "../utility/auth";
import { employeeRepository } from "../src/repositories/employee.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getEmployeeById: T_getEmployeeById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const employee = await employeeRepository.findById(req.path.id);
  if (!employee) throw new Error('Employee not found');
  return employee;
});
