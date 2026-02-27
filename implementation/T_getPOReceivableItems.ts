import { Request, Response } from 'express';
import { prisma } from '../src/libs/prisma';
import { PurchaseOrder_status_enum } from '@prisma/client';
import { apiWrapper } from '../src/utils/apiWrapper';

/**
 * GET /purchase-orders/:id/receivable-items
 * Return PO items yang masih bisa diterima (received_quantity < quantity)
 * khusus untuk dropdown di form MaterialReceipt
 */
export const handler = apiWrapper(async (req: any, res: any) => {
    const poId = parseInt(req.params.id);

    const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
            Supplier: { select: { id: true, name: true, code: true } },
            Factory: { select: { id: true, name: true, code: true } },
            PurchaseOrderItem: {
                include: {
                    ProductType: {
                        include: { RiceVariety: true }
                    }
                }
            }
        }
    });

    if (!po) {
        return res.status(404).json({ success: false, message: 'PO not found' });
    }

    // Filter items yang masih bisa diterima
    const receivableItems = po.PurchaseOrderItem
        .filter((item: any) => Number(item.received_quantity) < Number(item.quantity))
        .map((item: any) => ({
            ...item,
            remaining_quantity: Number(item.quantity) - Number(item.received_quantity)
        }));

    return res.json({
        success: true,
        data: {
            po: {
                id: po.id,
                po_number: po.po_number,
                status: po.status,
                Supplier: po.Supplier,
                Factory: po.Factory
            },
            receivableItems
        }
    });
});
