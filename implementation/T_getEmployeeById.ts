import { T_getEmployeeById } from "../types/api/T_getEmployeeById";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";

export const t_getEmployeeById: T_getEmployeeById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const employee = await Employee.findOne({ where: { id: req.path.id } });
  if (!employee) throw new Error('Employee not found');
  return employee;
}
