
import { T_updateMachine } from "../types/api/T_updateMachine";
import { Machine_status_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateMachine: T_updateMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const id = Number(req.path.id);
  const machine = await machineRepository.findById(id);
  if (!machine) throw new Error('Machine not found');

  const {
    code,
    name,
    machine_type,
    capacity_per_hour,
    status,
    last_maintenance_date,
    next_maintenance_date,
    id_production_line,
    sequence_order
  } = req.body as any;

  // Only update fields that exist in Prisma schema
  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (machine_type !== undefined) updateData.machine_type = machine_type;
  if (capacity_per_hour !== undefined) updateData.capacity_per_hour = Number(capacity_per_hour);
  if (status !== undefined) updateData.status = status as Machine_status_enum;
  if (last_maintenance_date !== undefined) updateData.last_maintenance_date = last_maintenance_date ? new Date(last_maintenance_date) : null;
  if (next_maintenance_date !== undefined) updateData.next_maintenance_date = next_maintenance_date ? new Date(next_maintenance_date) : null;
  if (id_production_line !== undefined) updateData.id_production_line = id_production_line ? Number(id_production_line) : null;
  if (sequence_order !== undefined) updateData.sequence_order = sequence_order ? Number(sequence_order) : null;

  return await machineRepository.update(id, updateData);
});
