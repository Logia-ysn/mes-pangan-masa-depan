import { T_getAttendances } from "../types/api/T_getAttendances";
import { Attendance } from "../types/model/table/Attendance";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getAttendances: T_getAttendances = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_employee, status, start_date, end_date } = req.query;
  const where: any = {};
  if (id_employee) where.id_employee = id_employee;
  if (status) where.status = status;
  if (start_date && end_date) where.attendance_date = Between(start_date, end_date);
  else if (start_date) where.attendance_date = MoreThanOrEqual(start_date);
  else if (end_date) where.attendance_date = LessThanOrEqual(end_date);
  const [data, total] = await Attendance.findAndCount({ where, take: limit, skip: offset, order: { attendance_date: 'DESC' } });
  return { data, total };
}
