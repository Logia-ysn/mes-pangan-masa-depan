import { T_updateAttendance } from "../types/api/T_updateAttendance";
import { Attendance } from "../types/model/table/Attendance";
import { getUserFromToken } from "../utility/auth";
import { AttendanceStatus } from "../types/model/enum/AttendanceStatus";

export const t_updateAttendance: T_updateAttendance = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const attendance = await Attendance.findOne({ where: { id: req.path.id } });
  if (!attendance) throw new Error('Attendance not found');
  const { attendance_date, check_in_time, check_out_time, status, notes } = req.body;
  if (attendance_date !== undefined) attendance.attendance_date = new Date(attendance_date);
  // check_in_time and check_out_time are TIME type, passed as strings like "08:00:00"
  if (check_in_time !== undefined) attendance.check_in_time = check_in_time as any;
  if (check_out_time !== undefined) attendance.check_out_time = check_out_time as any;
  if (status !== undefined) attendance.status = status as AttendanceStatus;
  if (notes !== undefined) attendance.notes = notes;
  await attendance.save();
  return attendance;
}
