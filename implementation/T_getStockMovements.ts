import { T_getStockMovements } from "../types/api/T_getStockMovements";
import { StockMovement } from "../types/model/table/StockMovement";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getStockMovements: T_getStockMovements = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 100, offset = 0, id_stock, movement_type, start_date, end_date } = req.query;
  const where: any = {};
  if (id_stock) where.id_stock = id_stock;
  if (movement_type) where.movement_type = movement_type;
  if (start_date && end_date) where.created_at = Between(new Date(start_date), new Date(end_date));
  else if (start_date) where.created_at = MoreThanOrEqual(new Date(start_date));
  else if (end_date) where.created_at = LessThanOrEqual(new Date(end_date));
  const [data, total] = await StockMovement.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { created_at: 'DESC' },
    relations: ['otm_id_stock', 'otm_id_stock.otm_id_product_type', 'otm_id_user']
  });
  return { data, total };
}
