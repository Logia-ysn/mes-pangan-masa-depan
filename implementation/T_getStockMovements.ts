import { T_getStockMovements } from "../types/api/T_getStockMovements";
import { stockMovementRepository } from "../src/repositories/stock-movement.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getStockMovements: T_getStockMovements = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { limit, offset, id_stock, movement_type, start_date, end_date } = req.query;

  const { movements, total } = await stockMovementRepository.findWithFilters({
    limit: limit ? Number(limit) : 100,
    offset: offset ? Number(offset) : 0,
    id_stock: id_stock ? Number(id_stock) : undefined,
    movement_type: movement_type as string,
    start_date: start_date ? new Date(start_date as string) : undefined,
    end_date: end_date ? new Date(end_date as string) : undefined
  });

  return { data: movements as any, total };
});
