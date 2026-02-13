import { T_updateStock } from "../types/api/T_updateStock";
import { stockRepository } from "../src/repositories/stock.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateStock: T_updateStock = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const stockId = Number(req.path.id);
  const stock = await stockRepository.findById(stockId);
  if (!stock) throw new Error('Stock not found');

  const { quantity, unit } = req.body;

  const updatedStock = await stockRepository.update(stockId, {
    quantity: quantity !== undefined ? Number(quantity) : undefined,
    unit
  });

  return updatedStock as any;
});
