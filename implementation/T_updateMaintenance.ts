
import { T_updateMaintenance } from "../types/api/T_updateMaintenance";
import { Maintenance_maintenance_type_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { maintenanceRepository } from "../src/repositories/maintenance.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateMaintenance: T_updateMaintenance = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');
  const maintenance = await maintenanceRepository.findById(req.path.id);
  if (!maintenance) throw new Error('Maintenance not found');

  const { maintenance_type, maintenance_date, cost, description, parts_replaced, next_maintenance_date } = req.body;
  const updateData: any = {};
  if (maintenance_type !== undefined) updateData.maintenance_type = maintenance_type as Maintenance_maintenance_type_enum;
  if (maintenance_date !== undefined) updateData.maintenance_date = new Date(maintenance_date);
  if (cost !== undefined) updateData.cost = Number(cost);
  if (description !== undefined) updateData.description = description;
  if (parts_replaced !== undefined) updateData.parts_replaced = parts_replaced;
  if (next_maintenance_date !== undefined) updateData.next_maintenance_date = next_maintenance_date ? new Date(next_maintenance_date) : null;

  return await maintenanceRepository.update(req.path.id, updateData);
});
