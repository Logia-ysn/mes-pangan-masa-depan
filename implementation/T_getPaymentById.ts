import { T_getPaymentById } from "../types/api/T_getPaymentById";
import { Payment } from "../types/model/table/Payment";
import { getUserFromToken } from "../utility/auth";

export const t_getPaymentById: T_getPaymentById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const payment = await Payment.findOne({ where: { id: req.path.id } });
  if (!payment) throw new Error('Payment not found');
  return payment;
}
