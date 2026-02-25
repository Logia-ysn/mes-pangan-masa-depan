import { T_getDeliveryOrderById } from "../types/api/T_getDeliveryOrderById";
import { prisma } from "../src/libs/prisma";

export const t_getDeliveryOrderById: T_getDeliveryOrderById = async (req, res) => {
  const { id } = req.path;

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: Number(id) },
    include: {
      Invoice: {
        include: {
          Customer: true
        }
      },
      DeliveryOrderItem: {
        include: {
          InvoiceItem: {
            include: {
              ProductType: true
            }
          }
        }
      }
    }
  });

  if (!order) throw new Error("Delivery Order not found");

  return {
    ...order,
    id: Number(order.id),
    delivery_date: order.delivery_date.toISOString().split('T')[0],
    received_date: order.received_date ? order.received_date.toISOString().split('T')[0] : undefined,
    driver_name: order.driver_name || undefined,
    vehicle_number: order.vehicle_number || undefined,
    notes: order.notes || undefined,
    Invoice: order.Invoice,
    DeliveryOrderItem: order.DeliveryOrderItem.map((item: any) => ({
      id: Number(item.id),
      quantity_delivered: Number(item.quantity_delivered),
      InvoiceItem: {
        quantity: Number(item.InvoiceItem.quantity),
        price: Number(item.InvoiceItem.unit_price),
        ProductType: {
          name: item.InvoiceItem.ProductType.name
        }
      }
    }))
  } as any;
}
