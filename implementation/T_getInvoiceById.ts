import { T_getInvoiceById } from "../types/api/T_getInvoiceById";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";

export const t_getInvoiceById: T_getInvoiceById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const invoice = await Invoice.findOne({ where: { id: req.path.id } });
  if (!invoice) throw new Error('Invoice not found');
  return invoice;
}
