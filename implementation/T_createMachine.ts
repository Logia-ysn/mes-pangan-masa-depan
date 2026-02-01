import { T_createMachine } from "../types/api/T_createMachine";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";
import { MachineStatus } from "../types/model/enum/MachineStatus";

export const t_createMachine: T_createMachine = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

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
    warranty_months
  } = req.body;

  // Check for existing code
  const existing = await Machine.findOne({ where: { code } });
  if (existing) throw new Error('Machine code already exists');

  // Create machine
  const machine = new Machine();
  machine.id_factory = id_factory;
  machine.code = code;
  machine.name = name;
  machine.machine_type = machine_type;
  machine.capacity_per_hour = capacity_per_hour;
  machine.status = (status as MachineStatus) || MachineStatus.ACTIVE;

  // New fields
  if (serial_number) machine.serial_number = serial_number;
  if (manufacture_year) machine.manufacture_year = manufacture_year;
  if (purchase_date) machine.purchase_date = new Date(purchase_date);
  if (vendor_id) machine.vendor_id = vendor_id;
  if (purchase_price) machine.purchase_price = purchase_price;
  if (warranty_months) machine.warranty_months = warranty_months;

  await machine.save();
  return machine;
}
