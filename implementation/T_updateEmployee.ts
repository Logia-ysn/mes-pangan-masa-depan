
import { T_updateEmployee } from "../types/api/T_updateEmployee";
import { Employee_gender_enum, Employee_employment_status_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { employeeRepository } from "../src/repositories/employee.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateEmployee: T_updateEmployee = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');
  const employee = await employeeRepository.findById(req.path.id);
  if (!employee) throw new Error('Employee not found');

  const { id_factory, id_user, employee_code, fullname, nik, phone, email, address, birth_date, birth_place, gender, religion, marital_status, position, department, join_date, employment_status, salary, is_active } = req.body;

  const updateData: any = {};
  if (id_factory !== undefined) updateData.id_factory = id_factory;
  if (id_user !== undefined) updateData.id_user = id_user;
  if (employee_code !== undefined) updateData.employee_code = employee_code;
  if (fullname !== undefined) updateData.fullname = fullname;
  if (nik !== undefined) updateData.nik = nik;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (birth_date !== undefined) updateData.birth_date = new Date(birth_date);
  if (birth_place !== undefined) updateData.birth_place = birth_place;
  if (gender !== undefined) updateData.gender = gender as Employee_gender_enum;
  if (religion !== undefined) updateData.religion = religion;
  if (marital_status !== undefined) updateData.marital_status = marital_status;
  if (position !== undefined) updateData.position = position;
  if (department !== undefined) updateData.department = department;
  if (join_date !== undefined) updateData.join_date = new Date(join_date);
  if (employment_status !== undefined) updateData.employment_status = employment_status as Employee_employment_status_enum;
  if (salary !== undefined) updateData.salary = salary;
  if (is_active !== undefined) updateData.is_active = is_active;

  return await employeeRepository.update(req.path.id, updateData);
});
