import { T_getProductTypes } from "../types/api/T_getProductTypes";
import { productTypeRepository } from "../src/repositories/product-type.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getProductTypes: T_getProductTypes = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const { limit, offset, search } = req.query;

  const { productTypes, total } = await productTypeRepository.findWithFilters({
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
    search: search as string
  });

  return { data: productTypes as any, total };
});
