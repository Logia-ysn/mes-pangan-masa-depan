import { T_getAttendanceById } from "../types/api/T_getAttendanceById";
import { Attendance } from "../types/model/table/Attendance";
import { getUserFromToken } from "../utility/auth";

export const t_getAttendanceById: T_getAttendanceById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const attendance = await Attendance.findOne({ where: { id: req.path.id } });
  if (!attendance) throw new Error('Attendance not found');
  return attendance;
}
