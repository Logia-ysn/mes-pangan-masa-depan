
import { T_getMachines } from "../types/api/T_getMachines";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getMachines: T_getMachines = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const { limit, offset, id_factory, status } = req.query;

  const { data, total } = await machineRepository.findWithFilters({
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
    id_factory: id_factory ? Number(id_factory) : undefined,
    status: status as string
  });

  return { data: data as any, total };
});
