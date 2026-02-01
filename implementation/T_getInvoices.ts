import { T_getInvoices } from "../types/api/T_getInvoices";
import { Invoice } from "../types/model/table/Invoice";
import { getUserFromToken } from "../utility/auth";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export const t_getInvoices: T_getInvoices = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { limit = 10, offset = 0, id_factory, id_customer, status, start_date, end_date } = req.query;
  const where: any = {};
  if (id_factory) where.id_factory = id_factory;
  if (id_customer) where.id_customer = id_customer;
  if (status) where.status = status;
  if (start_date && end_date) where.invoice_date = Between(start_date, end_date);
  else if (start_date) where.invoice_date = MoreThanOrEqual(start_date);
  else if (end_date) where.invoice_date = LessThanOrEqual(end_date);
  const [data, total] = await Invoice.findAndCount({ where, take: limit, skip: offset, order: { invoice_date: 'DESC' } });
  return { data, total };
}
