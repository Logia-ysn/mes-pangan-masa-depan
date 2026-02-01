import { T_createStock } from "../types/api/T_createStock";
import { Stock } from "../types/model/table/Stock";
import { getUserFromToken } from "../utility/auth";

export const t_createStock: T_createStock = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, id_product_type, quantity, unit } = req.body;
  const stock = new Stock();
  stock.id_factory = id_factory;
  stock.id_product_type = id_product_type;
  stock.quantity = quantity;
  stock.unit = unit || 'kg';
  await stock.save();
  return stock;
}
