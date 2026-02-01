import { T_updateStock } from "../types/api/T_updateStock";
import { Stock } from "../types/model/table/Stock";
import { getUserFromToken } from "../utility/auth";

export const t_updateStock: T_updateStock = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const stock = await Stock.findOne({ where: { id: req.path.id } });
  if (!stock) throw new Error('Stock not found');
  const { quantity, unit } = req.body;
  if (quantity !== undefined) stock.quantity = quantity;
  if (unit !== undefined) stock.unit = unit;
  stock.updated_at = new Date();
  await stock.save();
  return stock;
}
