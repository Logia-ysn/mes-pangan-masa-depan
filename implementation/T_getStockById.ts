import { T_getStockById } from "../types/api/T_getStockById";
import { Stock } from "../types/model/table/Stock";
import { getUserFromToken } from "../utility/auth";

export const t_getStockById: T_getStockById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const stock = await Stock.findOne({ where: { id: req.path.id } });
  if (!stock) throw new Error('Stock not found');
  return stock;
}
