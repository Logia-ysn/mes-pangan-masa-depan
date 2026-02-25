import { T_createDeliveryOrder } from "../types/api/T_createDeliveryOrder";
import { prisma } from "../src/libs/prisma";
import { Prisma } from "@prisma/client";

export const t_createDeliveryOrder: T_createDeliveryOrder = async (req, res) => {
  const { id_invoice, do_number, delivery_date, driver_name, vehicle_number, notes, items } = req.body;
  const user = (res as any).locals.user;

  try {
    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const doRecord = await tx.deliveryOrder.create({
        data: {
          id_invoice: Number(id_invoice),
          id_user: user.id,
          do_number: do_number,
          delivery_date: new Date(delivery_date),
          driver_name: driver_name || null,
          vehicle_number: vehicle_number || null,
          notes: notes || null,
          status: 'PENDING',
          DeliveryOrderItem: {
            create: items.map((item: any) => ({
              id_invoice_item: Number(item.id_invoice_item),
              quantity_delivered: Number(item.quantity_delivered)
            }))
          }
        }
      });
      return doRecord;
    });

    return {
      id: Number(created.id),
      id_invoice: created.id_invoice,
      do_number: created.do_number,
      delivery_date: created.delivery_date.toISOString().split('T')[0],
      status: created.status
    } as any;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Nomor Surat Jalan sudah terdaftar");
    }
    throw new Error(`Failed to create Delivery Order: ${error.message}`);
  }
}
