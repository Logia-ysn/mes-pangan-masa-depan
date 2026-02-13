
import { T_getMachineById } from "../types/api/T_getMachineById";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getMachineById: T_getMachineById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const machine = await machineRepository.findById(req.path.id);
  if (!machine) throw new Error('Machine not found');
  return machine;
});
