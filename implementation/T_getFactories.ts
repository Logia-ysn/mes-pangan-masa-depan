import { T_getFactories } from "../types/api/T_getFactories";
import { factoryRepository } from "../src/repositories/factory.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getFactories: T_getFactories = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const { limit, offset, search } = req.query;

  const { factories, total } = await factoryRepository.findWithFilters({
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0,
    search: search as string
  });

  return { data: factories as any, total };
});
