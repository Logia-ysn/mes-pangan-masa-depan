import { T_updateMachine } from "../types/api/T_updateMachine";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";
import { MachineStatus } from "../types/model/enum/MachineStatus";

export const t_updateMachine: T_updateMachine = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const machine = await Machine.findOne({ where: { id: req.path.id } }) as any;
  if (!machine) throw new Error('Machine not found');

  const body = req.body as any; // Type assertion for extended properties
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
  } = body;

  // Update existing fields
  if (code !== undefined) machine.code = code;
  if (name !== undefined) machine.name = name;
  if (machine_type !== undefined) machine.machine_type = machine_type;
  if (capacity_per_hour !== undefined) machine.capacity_per_hour = capacity_per_hour;
  if (status !== undefined) machine.status = status as MachineStatus;
  if (last_maintenance_date !== undefined) machine.last_maintenance_date = new Date(last_maintenance_date);
  if (next_maintenance_date !== undefined) machine.next_maintenance_date = new Date(next_maintenance_date);

  // Update new fields
  if (serial_number !== undefined) machine.serial_number = serial_number;
  if (manufacture_year !== undefined) machine.manufacture_year = manufacture_year;
  if (purchase_date !== undefined) machine.purchase_date = new Date(purchase_date);
  if (vendor_id !== undefined) machine.vendor_id = vendor_id;
  if (purchase_price !== undefined) machine.purchase_price = purchase_price;
  if (warranty_months !== undefined) machine.warranty_months = warranty_months;

  machine.updated_at = new Date();
  await machine.save();
  return machine;
}
