import { T_getSalesSummary } from "../types/api/T_getSalesSummary";
import { Invoice } from "../types/model/table/Invoice";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";
import { Between, In } from "typeorm";
import { InvoiceStatus } from "../types/model/enum/InvoiceStatus";

export const t_getSalesSummary: T_getSalesSummary = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, start_date, end_date } = req.query;

  const where: any = { invoice_date: Between(start_date, end_date) };
  if (id_factory) where.id_factory = id_factory;

  const invoices = await Invoice.find({ where });

  const total_invoices = invoices.length;
  const total_revenue = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const total_paid = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + Number(i.total), 0);
  const total_outstanding = total_revenue - total_paid;

  // Group by customer
  const customerIds = [...new Set(invoices.map(i => i.id_customer))];
  const customers = customerIds.length > 0 ? await Customer.find({ where: { id: In(customerIds) } }) : [];
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const byCustomerMap: { [key: string]: number } = {};
  invoices.forEach(i => {
    const name = customerMap.get(i.id_customer) || 'Unknown';
    byCustomerMap[name] = (byCustomerMap[name] || 0) + Number(i.total);
  });
  const by_customer = Object.entries(byCustomerMap).map(([customer_name, total]) => ({ customer_name, total }));

  return { total_invoices, total_revenue, total_paid, total_outstanding, by_customer };
}
