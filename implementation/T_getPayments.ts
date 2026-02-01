import { T_getPayments } from "../types/api/T_getPayments";
import { Payment } from "../types/model/table/Payment";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getPayments: T_getPayments = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_invoice, payment_method, start_date, end_date } = req.query;
  const where: any = {};
  if (id_invoice) where.id_invoice = id_invoice;
  if (payment_method) where.payment_method = payment_method;
  if (start_date && end_date) where.payment_date = Between(start_date, end_date);
  else if (start_date) where.payment_date = MoreThanOrEqual(start_date);
  else if (end_date) where.payment_date = LessThanOrEqual(end_date);
  const [data, total] = await Payment.findAndCount({ where, take: limit, skip: offset, order: { payment_date: 'DESC' } });
  return { data, total };
}
