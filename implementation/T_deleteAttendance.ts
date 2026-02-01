import { T_deleteAttendance } from "../types/api/T_deleteAttendance";
import { Attendance } from "../types/model/table/Attendance";
import { getUserFromToken } from "../utility/auth";

export const t_deleteAttendance: T_deleteAttendance = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const attendance = await Attendance.findOne({ where: { id: req.path.id } });
  if (!attendance) throw new Error('Attendance not found');
  await attendance.remove();
  return { message: 'Attendance deleted successfully', success: true };
}
