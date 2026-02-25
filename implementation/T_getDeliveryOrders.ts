import { T_getDeliveryOrders } from "../types/api/T_getDeliveryOrders";
import { prisma } from "../src/libs/prisma";

export const t_getDeliveryOrders: T_getDeliveryOrders = async (req, res) => {
  const { limit = 20, offset = 0, id_invoice, status } = req.query;

  const where: any = {};
  if (id_invoice) where.id_invoice = Number(id_invoice);
  if (status) where.status = status;

  const [total, data] = await Promise.all([
    prisma.deliveryOrder.count({ where }),
    prisma.deliveryOrder.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      include: {
        Invoice: {
          include: {
            Customer: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
  ]);

  return {
    total,
    data: data.map((d: any) => ({
      ...d,
      id: Number(d.id),
      delivery_date: d.delivery_date.toISOString().split('T')[0],
      Invoice: d.Invoice
    })) as any
  };
}
