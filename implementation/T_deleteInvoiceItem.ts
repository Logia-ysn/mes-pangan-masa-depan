import { T_deleteInvoiceItem } from "../types/api/T_deleteInvoiceItem";
import { InvoiceItem } from "../types/model/table/InvoiceItem";
import { getUserFromToken } from "../utility/auth";

export const t_deleteInvoiceItem: T_deleteInvoiceItem = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const item = await InvoiceItem.findOne({ where: { id: req.path.id } });
  if (!item) throw new Error('Invoice item not found');
  await item.remove();
  return { message: 'Invoice item deleted successfully', success: true };
}
