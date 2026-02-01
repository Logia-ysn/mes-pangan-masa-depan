import { T_getInvoiceItems } from "../types/api/T_getInvoiceItems";
import { InvoiceItem } from "../types/model/table/InvoiceItem";
import { getUserFromToken } from "../utility/auth";

export const t_getInvoiceItems: T_getInvoiceItems = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const [data, total] = await InvoiceItem.findAndCount({ where: { id_invoice: req.path.id } });
  return { data, total };
}
