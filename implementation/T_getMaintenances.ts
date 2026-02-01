import { T_getMaintenances } from "../types/api/T_getMaintenances";
import { Maintenance } from "../types/model/table/Maintenance";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getMaintenances: T_getMaintenances = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_machine, maintenance_type, start_date, end_date } = req.query;
  const where: any = {};
  if (id_machine) where.id_machine = id_machine;
  if (maintenance_type) where.maintenance_type = maintenance_type;
  if (start_date && end_date) where.maintenance_date = Between(start_date, end_date);
  else if (start_date) where.maintenance_date = MoreThanOrEqual(start_date);
  else if (end_date) where.maintenance_date = LessThanOrEqual(end_date);
  const [data, total] = await Maintenance.findAndCount({ where, take: limit, skip: offset, order: { maintenance_date: 'DESC' } });
  return { data, total };
}
