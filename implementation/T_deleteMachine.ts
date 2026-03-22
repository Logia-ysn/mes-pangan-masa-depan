
import { T_deleteMachine } from "../types/api/T_deleteMachine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";

export const t_deleteMachine: T_deleteMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');
  const id = Number(req.path.id);
  const machine = await machineRepository.findById(id);
  if (!machine) throw new Error('Machine not found');
  await machineRepository.delete(id);
  return { message: 'Machine deleted successfully', success: true };
});
