
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
    serial_number,
    manufacture_year,
    purchase_date,
    vendor_id,
    purchase_price,
    warranty_months,
    id_production_line,
    sequence_order
  } = req.body as any;

  // Check for existing code
  const existing = await machineRepository.findOne({ where: { code } });
  if (existing) throw new Error('Machine code already exists');

  // Create machine
  return await machineRepository.create({
    id_factory: Number(id_factory),
    code,
    name,
    machine_type,
    capacity_per_hour: Number(capacity_per_hour),
    status: (status as Machine_status_enum) || Machine_status_enum.ACTIVE,
    serial_number,
    manufacture_year: manufacture_year ? Number(manufacture_year) : null,
    purchase_date: purchase_date ? new Date(purchase_date) : null,
    vendor_id: vendor_id ? Number(vendor_id) : null,
    purchase_price: purchase_price ? Number(purchase_price) : null,
    warranty_months: warranty_months ? Number(warranty_months) : null,
    id_production_line: id_production_line ? Number(id_production_line) : null,
    sequence_order: sequence_order ? Number(sequence_order) : null
  });
});
