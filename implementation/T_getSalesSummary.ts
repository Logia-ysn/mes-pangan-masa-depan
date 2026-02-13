import { T_getSalesSummary } from "../types/api/T_getSalesSummary";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { prisma } from "../src/libs/prisma";

export const t_getSalesSummary: T_getSalesSummary = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { id_factory, start_date, end_date } = req.query;

  const where: any = {
    invoice_date: {
      gte: new Date(start_date as string),
      lte: new Date(end_date as string),
    },
  };
  if (id_factory) where.id_factory = Number(id_factory);

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      Customer: true,
      Payment: true,
    },
  });

  const total_invoices = invoices.length;
  const total_revenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const total_paid = invoices.reduce(
    (sum, inv) => sum + inv.Payment.reduce((s, p) => s + Number(p.amount), 0),
    0
  );
  const total_outstanding = total_revenue - total_paid;

  // Group by customer
  const customerMap = new Map<string, number>();
  invoices.forEach((inv) => {
    const name = inv.Customer?.name || 'Unknown';
    customerMap.set(name, (customerMap.get(name) || 0) + Number(inv.total));
  });

  const by_customer = Array.from(customerMap.entries())
    .map(([customer_name, total]) => ({ customer_name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    total_invoices,
    total_revenue,
    total_paid,
    total_outstanding,
    by_customer,
  };
});
