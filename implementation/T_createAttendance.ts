import { T_createAttendance } from "../types/api/T_createAttendance";
import { Attendance } from "../types/model/table/Attendance";
import { getUserFromToken } from "../utility/auth";
import { AttendanceStatus } from "../types/model/enum/AttendanceStatus";

export const t_createAttendance: T_createAttendance = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_employee, attendance_date, check_in_time, check_out_time, status, notes } = req.body;
  const attendance = new Attendance();
  attendance.id_employee = id_employee;
  attendance.id_user = user.id;
  attendance.attendance_date = new Date(attendance_date);
  // check_in_time and check_out_time are TIME type, passed as strings like "08:00:00"
  if (check_in_time) attendance.check_in_time = check_in_time as any;
  if (check_out_time) attendance.check_out_time = check_out_time as any;
  attendance.status = (status as AttendanceStatus) || AttendanceStatus.PRESENT;
  if (notes) attendance.notes = notes;
  await attendance.save();
  return attendance;
}
