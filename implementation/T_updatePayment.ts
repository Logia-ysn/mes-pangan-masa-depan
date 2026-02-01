import { T_updatePayment } from "../types/api/T_updatePayment";
import { Payment } from "../types/model/table/Payment";
import { getUserFromToken } from "../utility/auth";
import { PaymentMethodType } from "../types/model/enum/PaymentMethodType";

export const t_updatePayment: T_updatePayment = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const payment = await Payment.findOne({ where: { id: req.path.id } });
  if (!payment) throw new Error('Payment not found');
  const { payment_date, amount, payment_method, reference_number, notes } = req.body;
  if (payment_date !== undefined) payment.payment_date = new Date(payment_date);
  if (amount !== undefined) payment.amount = amount;
  if (payment_method !== undefined) payment.payment_method = payment_method as PaymentMethodType;
  if (reference_number !== undefined) payment.reference_number = reference_number;
  if (notes !== undefined) payment.notes = notes;
  await payment.save();
  return payment;
}
