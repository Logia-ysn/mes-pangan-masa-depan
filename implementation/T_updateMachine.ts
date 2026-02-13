
import { T_updateMachine } from "../types/api/T_updateMachine";
import { Machine_status_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateMachine: T_updateMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const machine = await machineRepository.findById(req.path.id);
  if (!machine) throw new Error('Machine not found');

  const {
    code,
    name,
    machine_type,
    capacity_per_hour,
    status,
    last_maintenance_date,
    next_maintenance_date,
    serial_number,
    manufacture_year,
    purchase_date,
    vendor_id,
    purchase_price,
    warranty_months
  } = req.body as any;

  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (machine_type !== undefined) updateData.machine_type = machine_type;
  if (capacity_per_hour !== undefined) updateData.capacity_per_hour = Number(capacity_per_hour);
  if (status !== undefined) updateData.status = status as Machine_status_enum;
  if (last_maintenance_date !== undefined) updateData.last_maintenance_date = last_maintenance_date ? new Date(last_maintenance_date) : null;
  if (next_maintenance_date !== undefined) updateData.next_maintenance_date = next_maintenance_date ? new Date(next_maintenance_date) : null;
  if (serial_number !== undefined) updateData.serial_number = serial_number;
  if (manufacture_year !== undefined) updateData.manufacture_year = manufacture_year ? Number(manufacture_year) : null;
  if (purchase_date !== undefined) updateData.purchase_date = purchase_date ? new Date(purchase_date) : null;
  if (vendor_id !== undefined) updateData.vendor_id = vendor_id ? Number(vendor_id) : null;
  if (purchase_price !== undefined) updateData.purchase_price = purchase_price ? Number(purchase_price) : null;
  if (warranty_months !== undefined) updateData.warranty_months = warranty_months ? Number(warranty_months) : null;

  updateData.updated_at = new Date();

  return await machineRepository.update(req.path.id, updateData);
});
