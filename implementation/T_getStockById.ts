
import { T_getStockById } from "../types/api/T_getStockById";
import { requireAuth } from "../utility/auth";
import { stockRepository } from "../src/repositories/stock.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getStockById: T_getStockById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const stock = await stockRepository.findById(req.path.id);
  if (!stock) throw new Error('Stock not found');
  return stock;
});
