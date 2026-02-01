import { T_updateInvoice } from "../types/api/T_updateInvoice";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";
import { InvoiceStatus } from "../types/model/enum/InvoiceStatus";

export const t_updateInvoice: T_updateInvoice = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const invoice = await Invoice.findOne({ where: { id: req.path.id } });
  if (!invoice) throw new Error('Invoice not found');
  const { id_customer, invoice_number, invoice_date, due_date, subtotal, tax, discount, total, status, notes } = req.body;
  if (id_customer !== undefined) invoice.id_customer = id_customer;
  if (invoice_number !== undefined) invoice.invoice_number = invoice_number;
  if (invoice_date !== undefined) invoice.invoice_date = new Date(invoice_date);
  if (due_date !== undefined) invoice.due_date = new Date(due_date);
  if (subtotal !== undefined) invoice.subtotal = subtotal;
  if (tax !== undefined) invoice.tax = tax;
  if (discount !== undefined) invoice.discount = discount;
  if (total !== undefined) invoice.total = total;
  if (status !== undefined) invoice.status = status as InvoiceStatus;
  if (notes !== undefined) invoice.notes = notes;
  invoice.updated_at = new Date();
  await invoice.save();
  return invoice;
}
