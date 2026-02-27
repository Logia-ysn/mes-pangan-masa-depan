/**
 * Purchase Order Service
 * Handles PO management, goods receipt, and stock integration
 */

import { PurchaseOrder_status_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { stockService } from './stock.service';
import { BatchNumberingService } from './batch-numbering.service';
import { purchaseOrderRepository } from '../repositories/purchase-order.repository';
import { goodsReceiptRepository } from '../repositories/goods-receipt.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

class PurchaseOrderService {
    /**
     * Create a new purchase order with items
     */
    async createPO(
        data: {
            id_factory: number;
            id_supplier: number;
            order_date: string | Date;
            expected_date?: string | Date;
            tax?: number;
            discount?: number;
            notes?: string;
            items: { id_product_type: number; quantity: number; unit_price: number }[];
        },
        userId: number
    ) {
        const supplier = await prisma.supplier.findUnique({ where: { id: data.id_supplier } });
        if (!supplier) {
            throw new NotFoundError('Supplier', data.id_supplier);
        }

        const factory = await prisma.factory.findUnique({ where: { id: data.id_factory } });
        if (!factory) {
            throw new NotFoundError('Factory', data.id_factory);
        }

        if (!data.items || data.items.length === 0) {
            throw new BusinessRuleError('Purchase order must have at least one item');
        }

        // Auto-generate PO number: PO-{YYYYMMDD}-{seq}
        const today = new Date();
        const dateStr = today.getFullYear().toString()
            + (today.getMonth() + 1).toString().padStart(2, '0')
            + today.getDate().toString().padStart(2, '0');

        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const poCountToday = await prisma.purchaseOrder.count({
            where: {
                created_at: { gte: startOfDay, lt: endOfDay }
            }
        });

        const seq = (poCountToday + 1).toString().padStart(4, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        const po_number = `PO-${dateStr}-${seq}-${randomSuffix}`;

        const subtotal = data.items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
        );
        const total = subtotal + (data.tax || 0) - (data.discount || 0);

        const po = await prisma.$transaction(async (tx) => {
            const createdPO = await tx.purchaseOrder.create({
                data: {
                    id_factory: data.id_factory,
                    id_supplier: data.id_supplier,
                    id_user: userId,
                    po_number,
                    order_date: data.order_date,
                    expected_date: data.expected_date || null,
                    subtotal,
                    tax: data.tax || 0,
                    discount: data.discount || 0,
                    total,
                    status: PurchaseOrder_status_enum.DRAFT,
                    notes: data.notes
                }
            });

            for (const item of data.items) {
                const itemSubtotal = item.quantity * item.unit_price;
                await tx.purchaseOrderItem.create({
                    data: {
                        id_purchase_order: createdPO.id,
                        id_product_type: item.id_product_type,
                        quantity: item.quantity,
                        received_quantity: 0,
                        unit_price: item.unit_price,
                        subtotal: itemSubtotal
                    }
                });
            }

            return createdPO;
        });

        return await purchaseOrderRepository.findById(po.id);
    }

    /**
     * Update an existing purchase order
     */
    async updatePO(
        id: number,
        data: {
            order_date?: string | Date;
            expected_date?: string | Date;
            tax?: number;
            discount?: number;
            notes?: string;
            status?: PurchaseOrder_status_enum;
        },
        userId: number
    ) {
        const po = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po) {
            throw new NotFoundError('PurchaseOrder', id);
        }

        if (po.status === PurchaseOrder_status_enum.CANCELLED) {
            throw new BusinessRuleError('Cannot edit cancelled purchase order');
        }

        const updateData: any = {};
        if (data.order_date !== undefined) updateData.order_date = data.order_date;
        if (data.expected_date !== undefined) updateData.expected_date = data.expected_date;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status !== undefined) updateData.status = data.status;

        const newTax = data.tax !== undefined ? data.tax : Number(po.tax);
        const newDiscount = data.discount !== undefined ? data.discount : Number(po.discount);

        if (data.tax !== undefined) updateData.tax = data.tax;
        if (data.discount !== undefined) updateData.discount = data.discount;

        if (data.tax !== undefined || data.discount !== undefined) {
            updateData.total = Number(po.subtotal) + newTax - newDiscount;
        }

        await prisma.purchaseOrder.update({ where: { id }, data: updateData });

        return await purchaseOrderRepository.findById(id);
    }

    /**
     * Delete a purchase order (only DRAFT or CANCELLED)
     */
    async deletePO(id: number, userId: number) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                GoodsReceipt: { include: { GoodsReceiptItem: true } },
                PurchaseOrderItem: { include: { ProductType: true } }
            }
        });

        if (!po) {
            throw new NotFoundError('PurchaseOrder', id);
        }

        if (po.status !== PurchaseOrder_status_enum.DRAFT && po.status !== PurchaseOrder_status_enum.CANCELLED) {
            throw new BusinessRuleError('Can only delete DRAFT or CANCELLED purchase orders');
        }

        // Execute in transaction
        await prisma.$transaction(async (tx) => {
            // Reverse stock if there are goods receipts
            for (const receipt of po.GoodsReceipt) {
                for (const receiptItem of receipt.GoodsReceiptItem) {
                    const poItem = po.PurchaseOrderItem.find(i => i.id === receiptItem.id_purchase_order_item);
                    if (poItem) {
                        await stockService.removeStock(
                            po.id_factory,
                            poItem.ProductType.code,
                            Number(receiptItem.quantity_received),
                            userId,
                            'GOODS_RECEIPT_REVERSAL',
                            receipt.id,
                            tx
                        );
                    }
                }
            }

            // Delete in order: receipt items -> receipts -> PO items -> PO
            await tx.goodsReceiptItem.deleteMany({
                where: { GoodsReceipt: { id_purchase_order: id } }
            });
            await tx.goodsReceipt.deleteMany({ where: { id_purchase_order: id } });
            await tx.purchaseOrderItem.deleteMany({ where: { id_purchase_order: id } });
            await tx.purchaseOrder.delete({ where: { id } });
        });

        return { message: 'Purchase order deleted successfully' };
    }

    /**
     * Approve a purchase order (DRAFT -> APPROVED)
     */
    async approvePO(id: number, userId: number) {
        const po = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po) {
            throw new NotFoundError('PurchaseOrder', id);
        }

        if (po.status !== PurchaseOrder_status_enum.DRAFT) {
            throw new BusinessRuleError('Can only approve DRAFT purchase orders');
        }

        await prisma.purchaseOrder.update({
            where: { id },
            data: { status: PurchaseOrder_status_enum.APPROVED }
        });

        return await purchaseOrderRepository.findById(id);
    }

    /**
     * Cancel a purchase order and reverse all received stock
     */
    async cancelPO(id: number, userId: number) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                GoodsReceipt: { include: { GoodsReceiptItem: true } },
                PurchaseOrderItem: { include: { ProductType: true } }
            }
        });

        if (!po) {
            throw new NotFoundError('PurchaseOrder', id);
        }

        if (po.status === PurchaseOrder_status_enum.CANCELLED) {
            throw new BusinessRuleError('Purchase order is already cancelled');
        }

        // Execute in transaction
        return await prisma.$transaction(async (tx) => {
            // Reverse all received stock
            for (const receipt of po.GoodsReceipt) {
                for (const receiptItem of receipt.GoodsReceiptItem) {
                    const poItem = po.PurchaseOrderItem.find(i => i.id === receiptItem.id_purchase_order_item);
                    if (poItem) {
                        await stockService.removeStock(
                            po.id_factory,
                            poItem.ProductType.code,
                            Number(receiptItem.quantity_received),
                            userId,
                            'GOODS_RECEIPT_REVERSAL',
                            receipt.id,
                            tx
                        );
                    }
                }
            }

            // Reset received quantities
            for (const item of po.PurchaseOrderItem) {
                await tx.purchaseOrderItem.update({
                    where: { id: item.id },
                    data: { received_quantity: 0 }
                });
            }

            await tx.purchaseOrder.update({
                where: { id },
                data: { status: PurchaseOrder_status_enum.CANCELLED }
            });

            return await tx.purchaseOrder.findUnique({
                where: { id },
                include: { Factory: true, Supplier: true }
            });
        });
    }

    /**
     * Receive goods for a purchase order
     */
    async receiveGoods(
        poId: number,
        items: { id_purchase_order_item: number; quantity_received: number }[],
        receiptDate: string | Date,
        notes: string | undefined,
        userId: number
    ) {
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: {
                PurchaseOrderItem: { include: { ProductType: true } },
                Factory: true
            }
        });

        if (!po) {
            throw new NotFoundError('PurchaseOrder', poId);
        }

        if (po.status === PurchaseOrder_status_enum.CANCELLED) {
            throw new BusinessRuleError('Cannot receive goods for cancelled PO');
        }

        if (po.status === PurchaseOrder_status_enum.DRAFT) {
            throw new BusinessRuleError('Purchase order must be approved before receiving goods');
        }

        if (po.status === PurchaseOrder_status_enum.RECEIVED) {
            throw new BusinessRuleError('All items have already been received');
        }

        // Validate items
        for (const item of items) {
            const poItem = po.PurchaseOrderItem.find(i => i.id === item.id_purchase_order_item);
            if (!poItem) {
                throw new BusinessRuleError(`PO item ${item.id_purchase_order_item} not found`);
            }
            if (poItem.ProductType?.category === 'RAW_MATERIAL') {
                throw new BusinessRuleError(
                    `Item "${poItem.ProductType.name}" adalah bahan baku. Gunakan form Penerimaan Bahan Baku untuk menerima bahan baku (mendukung QC dan Quarantine).`
                );
            }
            const remaining = Number(poItem.quantity) - Number(poItem.received_quantity);
            if (item.quantity_received > remaining) {
                throw new BusinessRuleError(
                    `Cannot receive ${item.quantity_received} of ${poItem.ProductType.name}. Remaining: ${remaining}`
                );
            }
            if (item.quantity_received <= 0) {
                throw new BusinessRuleError('Quantity received must be greater than 0');
            }
        }

        // Auto-generate receipt number: GR-{YYYYMMDD}-{seq}
        const today = new Date();
        const dateStr = today.getFullYear().toString()
            + (today.getMonth() + 1).toString().padStart(2, '0')
            + today.getDate().toString().padStart(2, '0');

        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const grCountToday = await prisma.goodsReceipt.count({
            where: {
                created_at: { gte: startOfDay, lt: endOfDay }
            }
        });

        const seq = (grCountToday + 1).toString().padStart(4, '0');
        const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        const receipt_number = `GR-${dateStr}-${seq}-${randomSuffix}`;

        // Create goods receipt and update stock in transaction
        const receipt = await prisma.$transaction(async (tx) => {
            const createdReceipt = await tx.goodsReceipt.create({
                data: {
                    id_purchase_order: poId,
                    id_user: userId,
                    receipt_number,
                    receipt_date: receiptDate,
                    notes
                }
            });

            for (const item of items) {
                const poItem = po.PurchaseOrderItem.find(i => i.id === item.id_purchase_order_item)!;

                // Create receipt item
                await tx.goodsReceiptItem.create({
                    data: {
                        id_goods_receipt: createdReceipt.id,
                        id_purchase_order_item: item.id_purchase_order_item,
                        quantity_received: item.quantity_received
                    }
                });

                // Update received quantity on PO item
                await tx.purchaseOrderItem.update({
                    where: { id: item.id_purchase_order_item },
                    data: {
                        received_quantity: {
                            increment: item.quantity_received
                        }
                    }
                });

                // Add stock with auto-generated batch code
                const grDate = createdReceipt.receipt_date ? new Date(createdReceipt.receipt_date as any) : new Date();
                const batchCode = await BatchNumberingService.generateBatchForProduct(
                    po.Factory.code,
                    poItem.id_product_type,
                    grDate,
                    tx
                );

                await stockService.addStock(
                    po.id_factory,
                    poItem.ProductType.code,
                    item.quantity_received,
                    userId,
                    'GOODS_RECEIPT',
                    createdReceipt.id,
                    tx,
                    batchCode
                );
            }

            return createdReceipt;
        });

        // Update PO status based on received quantities
        await this.updatePOReceiveStatus(poId);

        return await goodsReceiptRepository.findById(receipt.id);
    }

    /**
     * Delete a goods receipt and reverse stock
     */
    async deleteGoodsReceipt(receiptId: number, userId: number) {
        const receipt = await prisma.goodsReceipt.findUnique({
            where: { id: receiptId },
            include: {
                PurchaseOrder: {
                    include: { PurchaseOrderItem: { include: { ProductType: true } } }
                },
                GoodsReceiptItem: true
            }
        });

        if (!receipt) {
            throw new NotFoundError('GoodsReceipt', receiptId);
        }

        const po = receipt.PurchaseOrder;

        await prisma.$transaction(async (tx) => {
            for (const receiptItem of receipt.GoodsReceiptItem) {
                const poItem = po.PurchaseOrderItem.find(i => i.id === receiptItem.id_purchase_order_item);
                if (poItem) {
                    // Reverse stock
                    await stockService.removeStock(
                        po.id_factory,
                        poItem.ProductType.code,
                        Number(receiptItem.quantity_received),
                        userId,
                        'GOODS_RECEIPT_REVERSAL',
                        receiptId,
                        tx
                    );

                    // Update received quantity on PO item
                    await tx.purchaseOrderItem.update({
                        where: { id: receiptItem.id_purchase_order_item },
                        data: {
                            received_quantity: {
                                decrement: Number(receiptItem.quantity_received)
                            }
                        }
                    });
                }
            }

            // Delete receipt items and receipt
            await tx.goodsReceiptItem.deleteMany({ where: { id_goods_receipt: receiptId } });
            await tx.goodsReceipt.delete({ where: { id: receiptId } });
        });

        // Update PO status
        await this.updatePOReceiveStatus(po.id);

        return { message: 'Goods receipt deleted successfully' };
    }

    /**
     * Update PO status based on received quantities
     */
    private async updatePOReceiveStatus(poId: number) {
        const poItems = await prisma.purchaseOrderItem.findMany({
            where: { id_purchase_order: poId }
        });

        const allReceived = poItems.every(i => Number(i.received_quantity) >= Number(i.quantity));
        const someReceived = poItems.some(i => Number(i.received_quantity) > 0);

        let newStatus: PurchaseOrder_status_enum;
        if (allReceived) {
            newStatus = PurchaseOrder_status_enum.RECEIVED;
        } else if (someReceived) {
            newStatus = PurchaseOrder_status_enum.PARTIAL_RECEIVED;
        } else {
            // Back to APPROVED if no items received
            const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
            if (po && po.status !== PurchaseOrder_status_enum.CANCELLED) {
                newStatus = PurchaseOrder_status_enum.APPROVED;
            } else {
                return;
            }
        }

        await prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: newStatus }
        });
    }
}

export const purchaseOrderService = new PurchaseOrderService();
