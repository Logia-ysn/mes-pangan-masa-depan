import { T_deletePayment } from "../types/api/T_deletePayment";
import { Payment } from "../types/model/table/Payment";
import { getUserFromToken } from "../utility/auth";

export const t_deletePayment: T_deletePayment = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const payment = await Payment.findOne({ where: { id: req.path.id } });
  if (!payment) throw new Error('Payment not found');
  await payment.remove();
  return { message: 'Payment deleted successfully', success: true };
}
