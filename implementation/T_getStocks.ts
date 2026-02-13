/**
 * Get Stocks Handler (Presentation Layer)
 */

import { T_getStocks } from "../types/api/T_getStocks";
import { requireAuth } from "../utility/auth";
import { stockRepository } from "../src/repositories/stock.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getStocks: T_getStocks = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  // 1. Extract query params
  const { limit, offset, id_factory, id_product_type } = req.query;

  // 2. Call repository
  const { stocks, total } = await stockRepository.findWithFilters({
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    id_factory: id_factory ? Number(id_factory) : undefined,
    id_product_type: id_product_type ? Number(id_product_type) : undefined
  });

  // 3. Return response
  return {
    data: stocks,
    total,
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0
  };
});
