import { T_updateInvoiceItem } from "../types/api/T_updateInvoiceItem";
import { InvoiceItem } from "../types/model/table/InvoiceItem";
import { getUserFromToken } from "../utility/auth";

export const t_updateInvoiceItem: T_updateInvoiceItem = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const item = await InvoiceItem.findOne({ where: { id: req.path.id } });
  if (!item) throw new Error('Invoice item not found');
  const { id_product_type, quantity, unit_price, subtotal } = req.body;
  if (id_product_type !== undefined) item.id_product_type = id_product_type;
  if (quantity !== undefined) item.quantity = quantity;
  if (unit_price !== undefined) item.unit_price = unit_price;
  if (subtotal !== undefined) item.subtotal = subtotal;
  await item.save();
  return item;
}
