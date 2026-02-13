import { T_createStock } from "../types/api/T_createStock";
import { apiWrapper } from "../src/utils/apiWrapper";
import { stockRepository } from "../src/repositories/stock.repository";
import { requireAuth } from "../utility/auth";

export const t_createStock: T_createStock = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');
  const { id_factory, id_product_type, quantity, unit } = req.body;

  const stock = await stockRepository.create({
    id_factory: Number(id_factory),
    id_product_type: Number(id_product_type),
    quantity: Number(quantity),
    unit: unit || 'kg'
  });

  return stock as any;
});
