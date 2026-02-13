import { T_getEmployees } from "../types/api/T_getEmployees";
import { employeeRepository } from "../src/repositories/employee.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getEmployees: T_getEmployees = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { limit, offset, id_factory, search, department, employment_status, is_active } = req.query;

  const { data, total } = await employeeRepository.findWithFilters({
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0,
    id_factory: id_factory ? Number(id_factory) : undefined,
    search: search as string,
    department: department as string,
    employment_status: employment_status as string,
    is_active: is_active !== undefined ? Boolean(is_active) : undefined
  });

  return { data: data as any, total };
});
