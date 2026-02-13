
import { T_createMaintenance } from "../types/api/T_createMaintenance";
import { apiWrapper } from "../src/utils/apiWrapper";
import { Maintenance_maintenance_type_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { maintenanceRepository } from "../src/repositories/maintenance.repository";
import { machineRepository } from "../src/repositories/machine.repository";

export const t_createMaintenance: T_createMaintenance = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'SUPERVISOR');
  const { id_machine, maintenance_type, maintenance_date, cost, description, parts_replaced, next_maintenance_date } = req.body;

  const machine = await machineRepository.findById(id_machine);
  if (!machine) throw new Error('Machine not found');

  const maintenance = await maintenanceRepository.create({
    id_machine,
    id_user: user.id,
    maintenance_type: maintenance_type as Maintenance_maintenance_type_enum,
    maintenance_date: new Date(maintenance_date),
    cost: cost || 0,
    description,
    parts_replaced,
    next_maintenance_date: next_maintenance_date ? new Date(next_maintenance_date) : null
  });

  // Update machine maintenance dates
  await machineRepository.update(id_machine, {
    last_maintenance_date: new Date(maintenance_date),
    next_maintenance_date: next_maintenance_date ? new Date(next_maintenance_date) : null
  });

  return maintenance;
});
