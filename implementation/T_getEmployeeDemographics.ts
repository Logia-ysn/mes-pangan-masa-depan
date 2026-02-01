import { T_getEmployeeDemographics } from "../types/api/T_getEmployeeDemographics";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";

export const t_getEmployeeDemographics: T_getEmployeeDemographics = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory } = req.query;

  const where: any = { is_active: true };
  if (id_factory) where.id_factory = id_factory;

  const employees = await Employee.find({ where });
  const total_employees = employees.length;

  // By gender
  const genderMap: { [key: string]: number } = {};
  employees.forEach(e => {
    genderMap[e.gender] = (genderMap[e.gender] || 0) + 1;
  });
  const by_gender = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

  // By department
  const deptMap: { [key: string]: number } = {};
  employees.forEach(e => {
    const dept = e.department || 'Unknown';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const by_department = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  // By employment status
  const statusMap: { [key: string]: number } = {};
  employees.forEach(e => {
    statusMap[e.employment_status] = (statusMap[e.employment_status] || 0) + 1;
  });
  const by_employment_status = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  return { total_employees, by_gender, by_department, by_employment_status };
}
