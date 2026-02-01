import { T_createMaintenance } from "../types/api/T_createMaintenance";
import { Maintenance } from "../types/model/table/Maintenance";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";
import { MaintenanceType } from "../types/model/enum/MaintenanceType";

export const t_createMaintenance: T_createMaintenance = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_machine, maintenance_type, maintenance_date, cost, description, parts_replaced, next_maintenance_date } = req.body;

  const machine = await Machine.findOne({ where: { id: id_machine } });
  if (!machine) throw new Error('Machine not found');

  const maintenance = new Maintenance();
  maintenance.id_machine = id_machine;
  maintenance.id_user = user.id;
  maintenance.maintenance_type = maintenance_type as MaintenanceType;
  maintenance.maintenance_date = new Date(maintenance_date);
  maintenance.cost = cost || 0;
  maintenance.description = description;
  maintenance.parts_replaced = parts_replaced;
  if (next_maintenance_date) maintenance.next_maintenance_date = new Date(next_maintenance_date);

  // Update machine maintenance dates
  machine.last_maintenance_date = new Date(maintenance_date);
  if (next_maintenance_date) machine.next_maintenance_date = new Date(next_maintenance_date);

  await maintenance.save();
  await machine.save();
  return maintenance;
}
