import { T_createPayment } from "../types/api/T_createPayment";
import { Payment } from "../types/model/table/Payment";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";
import { PaymentMethodType } from "../types/model/enum/PaymentMethodType";
import { InvoiceStatus } from "../types/model/enum/InvoiceStatus";

export const t_createPayment: T_createPayment = async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  const { id_invoice, payment_date, amount, payment_method, reference_number, notes } = req.body;
  const invoice = await Invoice.findOne({ where: { id: id_invoice } });
  if (!invoice) throw new Error('Invoice not found');
  const payment = new Payment();
  payment.id_invoice = id_invoice;
  payment.id_user = user.id;
  payment.payment_date = new Date(payment_date);
  payment.amount = amount;
  payment.payment_method = payment_method as PaymentMethodType;
  payment.reference_number = reference_number;
  payment.notes = notes;
  await payment.save();
  // Update invoice status based on payments
  const allPayments = await Payment.find({ where: { id_invoice } });
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  if (totalPaid >= Number(invoice.total)) {
    invoice.status = InvoiceStatus.PAID;
  } else if (totalPaid > 0) {
    invoice.status = InvoiceStatus.PARTIAL;
  }
  invoice.updated_at = new Date();
  await invoice.save();
  return payment;
}
