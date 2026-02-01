import { T_deleteInvoice } from "../types/api/T_deleteInvoice";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";

export const t_deleteInvoice: T_deleteInvoice = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const invoice = await Invoice.findOne({ where: { id: req.path.id } });
  if (!invoice) throw new Error('Invoice not found');
  await invoice.remove();
  return { message: 'Invoice deleted successfully', success: true };
}
