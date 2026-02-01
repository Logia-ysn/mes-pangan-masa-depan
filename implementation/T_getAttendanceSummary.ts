import { T_getAttendanceSummary } from "../types/api/T_getAttendanceSummary";
import { Attendance } from "../types/model/table/Attendance";
import { Employee } from "../types/model/table/Employee";
import { getUserFromToken } from "../utility/auth";
import { Between } from "typeorm";
import { AttendanceStatus } from "../types/model/enum/AttendanceStatus";

export const t_getAttendanceSummary: T_getAttendanceSummary = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, id_employee, start_date, end_date } = req.query;

  const where: any = { attendance_date: Between(start_date, end_date) };
  if (id_employee) where.id_employee = id_employee;

  // Filter by factory through employee
  let attendances = await Attendance.find({ where });

  if (id_factory) {
    const employees = await Employee.find({ where: { id_factory } });
    const employeeIds = new Set(employees.map(e => e.id));
    attendances = attendances.filter(a => employeeIds.has(a.id_employee));
  }

  const total_present = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const total_absent = attendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const total_sick = attendances.filter(a => a.status === AttendanceStatus.SICK).length;
  const total_leave = attendances.filter(a => a.status === AttendanceStatus.LEAVE).length;
  const total_permission = attendances.filter(a => a.status === AttendanceStatus.PERMISSION).length;
  const total = attendances.length;
  const attendance_rate = total > 0 ? (total_present / total) * 100 : 0;

  return { total_present, total_absent, total_sick, total_leave, total_permission, attendance_rate };
}
