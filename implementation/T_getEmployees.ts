import { T_getEmployees } from "../types/api/T_getEmployees";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";
import { Like } from "typeorm";

export const t_getEmployees: T_getEmployees = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_factory, search, department, employment_status, is_active } = req.query;
  const where: any = {};
  if (id_factory) where.id_factory = id_factory;
  if (search) where.fullname = Like(`%${search}%`);
  if (department) where.department = department;
  if (employment_status) where.employment_status = employment_status;
  if (is_active !== undefined) where.is_active = is_active;
  const [data, total] = await Employee.findAndCount({ where, take: limit, skip: offset, order: { created_at: 'DESC' } });
  return { data, total };
}
