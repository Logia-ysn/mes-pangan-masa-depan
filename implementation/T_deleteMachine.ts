
import { T_deleteMachine } from "../types/api/T_deleteMachine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";

export const t_deleteMachine: T_deleteMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');
  const machine = await machineRepository.findById(req.path.id);
  if (!machine) throw new Error('Machine not found');
  await machineRepository.delete(req.path.id);
  return { message: 'Machine deleted successfully', success: true };
});
