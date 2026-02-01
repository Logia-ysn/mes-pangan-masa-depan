import { T_deleteMachine } from "../types/api/T_deleteMachine";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";

export const t_deleteMachine: T_deleteMachine = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const machine = await Machine.findOne({ where: { id: req.path.id } });
  if (!machine) throw new Error('Machine not found');
  await machine.remove();
  return { message: 'Machine deleted successfully', success: true };
}
