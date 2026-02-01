import { T_updateMaintenance } from "../types/api/T_updateMaintenance";
import { Maintenance } from "../types/model/table/Maintenance";
import { getUserFromToken } from "../utility/auth";
import { MaintenanceType } from "../types/model/enum/MaintenanceType";

export const t_updateMaintenance: T_updateMaintenance = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const maintenance = await Maintenance.findOne({ where: { id: req.path.id } });
  if (!maintenance) throw new Error('Maintenance not found');
  const { maintenance_type, maintenance_date, cost, description, parts_replaced, next_maintenance_date } = req.body;
  if (maintenance_type !== undefined) maintenance.maintenance_type = maintenance_type as MaintenanceType;
  if (maintenance_date !== undefined) maintenance.maintenance_date = new Date(maintenance_date);
  if (cost !== undefined) maintenance.cost = cost;
  if (description !== undefined) maintenance.description = description;
  if (parts_replaced !== undefined) maintenance.parts_replaced = parts_replaced;
  if (next_maintenance_date !== undefined) maintenance.next_maintenance_date = new Date(next_maintenance_date);
  await maintenance.save();
  return maintenance;
}
