import { T_getFactories } from "../types/api/T_getFactories";
import { factoryRepository } from "../src/repositories/factory.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getFactories: T_getFactories = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const { limit, offset, search, is_active } = req.query;

  const filters: any = {
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0,
    search: search as string
  };

  if (is_active !== undefined) {
    if (is_active === 'true' || is_active === '1') filters.is_active = true;
    else if (is_active === 'false' || is_active === '0') filters.is_active = false;
  }

  const { factories, total } = await factoryRepository.findWithFilters(filters);

  return { data: factories as any, total };
});
