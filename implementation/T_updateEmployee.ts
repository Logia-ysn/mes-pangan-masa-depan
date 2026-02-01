import { T_updateEmployee } from "../types/api/T_updateEmployee";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";
import { Gender } from "../types/model/enum/Gender";
import { EmploymentStatus } from "../types/model/enum/EmploymentStatus";

export const t_updateEmployee: T_updateEmployee = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const employee = await Employee.findOne({ where: { id: req.path.id } });
  if (!employee) throw new Error('Employee not found');
  const { id_factory, id_user, employee_code, fullname, nik, phone, email, address, birth_date, birth_place, gender, religion, marital_status, position, department, join_date, employment_status, salary, is_active } = req.body;
  if (id_factory !== undefined) employee.id_factory = id_factory;
  if (id_user !== undefined) employee.id_user = id_user;
  if (employee_code !== undefined) employee.employee_code = employee_code;
  if (fullname !== undefined) employee.fullname = fullname;
  if (nik !== undefined) employee.nik = nik;
  if (phone !== undefined) employee.phone = phone;
  if (email !== undefined) employee.email = email;
  if (address !== undefined) employee.address = address;
  if (birth_date !== undefined) employee.birth_date = new Date(birth_date);
  if (birth_place !== undefined) employee.birth_place = birth_place;
  if (gender !== undefined) employee.gender = gender as Gender;
  if (religion !== undefined) employee.religion = religion;
  if (marital_status !== undefined) employee.marital_status = marital_status;
  if (position !== undefined) employee.position = position;
  if (department !== undefined) employee.department = department;
  if (join_date !== undefined) employee.join_date = new Date(join_date);
  if (employment_status !== undefined) employee.employment_status = employment_status as EmploymentStatus;
  if (salary !== undefined) employee.salary = salary;
  if (is_active !== undefined) employee.is_active = is_active;
  employee.updated_at = new Date();
  await employee.save();
  return employee;
}
