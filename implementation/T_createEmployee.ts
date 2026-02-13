
import { T_createEmployee } from "../types/api/T_createEmployee";
import { apiWrapper } from "../src/utils/apiWrapper";
import { Employee_gender_enum, Employee_employment_status_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { employeeRepository } from "../src/repositories/employee.repository";

export const t_createEmployee: T_createEmployee = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');
  const { id_factory, id_user, employee_code, fullname, nik, phone, email, address, birth_date, birth_place, gender, religion, marital_status, position, department, join_date, employment_status, salary } = req.body;

  const existing = await employeeRepository.findOne({ where: { employee_code } });
  if (existing) throw new Error('Employee code already exists');

  return await employeeRepository.create({
    id_factory,
    id_user,
    employee_code,
    fullname,
    nik,
    phone,
    email,
    address,
    birth_date: birth_date ? new Date(birth_date) : null,
    birth_place,
    gender: gender as Employee_gender_enum,
    religion,
    marital_status,
    position,
    department,
    join_date: new Date(join_date),
    employment_status: (employment_status as Employee_employment_status_enum) || Employee_employment_status_enum.PERMANENT,
    salary,
    is_active: true
  });
});
