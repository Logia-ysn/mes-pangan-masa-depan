import { T_createEmployee } from "../types/api/T_createEmployee";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";
import { Gender } from "../types/model/enum/Gender";
import { EmploymentStatus } from "../types/model/enum/EmploymentStatus";

export const t_createEmployee: T_createEmployee = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, id_user, employee_code, fullname, nik, phone, email, address, birth_date, birth_place, gender, religion, marital_status, position, department, join_date, employment_status, salary } = req.body;
  const existing = await Employee.findOne({ where: { employee_code } });
  if (existing) throw new Error('Employee code already exists');
  const employee = new Employee();
  employee.id_factory = id_factory;
  employee.id_user = id_user;
  employee.employee_code = employee_code;
  employee.fullname = fullname;
  employee.nik = nik;
  employee.phone = phone;
  employee.email = email;
  employee.address = address;
  if (birth_date) employee.birth_date = new Date(birth_date);
  employee.birth_place = birth_place;
  employee.gender = gender as Gender;
  employee.religion = religion;
  employee.marital_status = marital_status;
  employee.position = position;
  employee.department = department;
  employee.join_date = new Date(join_date);
  employee.employment_status = (employment_status as EmploymentStatus) || EmploymentStatus.PERMANENT;
  employee.salary = salary;
  employee.is_active = true;
  await employee.save();
  return employee;
}
