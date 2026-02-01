import { T_createInvoice } from "../types/api/T_createInvoice";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";
import { InvoiceStatus } from "../types/model/enum/InvoiceStatus";

export const t_createInvoice: T_createInvoice = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_factory, id_customer, invoice_number, invoice_date, due_date, subtotal, tax, discount, total, status, notes } = req.body;
  const existing = await Invoice.findOne({ where: { invoice_number } });
  if (existing) throw new Error('Invoice number already exists');
  const invoice = new Invoice();
  invoice.id_factory = id_factory;
  invoice.id_customer = id_customer;
  invoice.id_user = user.id;
  invoice.invoice_number = invoice_number;
  invoice.invoice_date = new Date(invoice_date);
  invoice.due_date = new Date(due_date);
  invoice.subtotal = subtotal || 0;
  invoice.tax = tax || 0;
  invoice.discount = discount || 0;
  invoice.total = total || 0;
  invoice.status = (status as InvoiceStatus) || InvoiceStatus.DRAFT;
  invoice.notes = notes;
  await invoice.save();
  return invoice;
}
