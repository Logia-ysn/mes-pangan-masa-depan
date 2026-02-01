import { T_getMachines } from "../types/api/T_getMachines";
import { Machine } from "../types/model/table/Machine";
import { getUserFromToken } from "../utility/auth";

export const t_getMachines: T_getMachines = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const { limit = 50, offset = 0, id_factory, status } = req.query;
  const where: any = {};

  if (id_factory) where.id_factory = id_factory;
  if (status) where.status = status;

  const [data, total] = await Machine.findAndCount({
    where,
    take: limit,
    skip: offset,
    relations: ['otm_id_factory', 'otm_vendor'],
    order: { id: 'ASC' }
  });

  return { data, total };
}
