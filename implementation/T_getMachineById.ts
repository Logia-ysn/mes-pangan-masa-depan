import { T_getMachineById } from "../types/api/T_getMachineById";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";

export const t_getMachineById: T_getMachineById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const machine = await Machine.findOne({ where: { id: req.path.id } });
  if (!machine) throw new Error('Machine not found');
  return machine;
}
