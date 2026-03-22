
import { T_createMachine } from "../types/api/T_createMachine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { Machine_status_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";

export const t_createMachine: T_createMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const {
    id_factory,
    code,
    name,
    machine_type,
    capacity_per_hour,
    status,
    id_production_line,
    sequence_order
  } = req.body as any;

  // Check for existing code
  const existing = await machineRepository.findOne({ where: { code } });
  if (existing) throw new Error('Machine code already exists');

  // Create machine (only fields that exist in Prisma schema)
  return await machineRepository.create({
    id_factory: Number(id_factory),
    code,
    name,
    machine_type: machine_type || null,
    capacity_per_hour: capacity_per_hour != null ? Number(capacity_per_hour) : null,
    status: (status as Machine_status_enum) || Machine_status_enum.ACTIVE,
    id_production_line: id_production_line ? Number(id_production_line) : null,
    sequence_order: sequence_order ? Number(sequence_order) : null
  });
});
