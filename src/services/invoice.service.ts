/**
 * Invoice Service
 * Handles invoice management business logic including items, payments, and stock integration
 */

import { Invoice, InvoiceItem, Payment, Invoice_status_enum, Payment_payment_method_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { stockService } from './stock.service';
import { invoiceRepository } from '../repositories/invoice.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

class InvoiceService {
    /**
     * Create a new invoice with items and stock deductions
     */
    async createInvoice(
        data: {
            id_factory: number;
            id_customer: number;
            invoice_date: string | Date;
            due_date: string | Date;
            tax?: number;
            discount?: number;
            notes?: string;
            items: { id_product_type: number; quantity: number; unit_price: number }[];
        },
        userId: number
    ) {
        // Validate customer exists
        const customer = await prisma.customer.findUnique({ where: { id: data.id_customer } });
        if (!customer) {
            throw new NotFoundError('Customer', data.id_customer);
        }

        // Validate factory exists
        const factory = await prisma.factory.findUnique({ where: { id: data.id_factory } });
        if (!factory) {
            throw new NotFoundError('Factory', data.id_factory);
        }

        // Auto-generate invoice number: INV-{YYYYMMDD}-{seq}
        const today = new Date();
        const dateStr = today.getFullYear().toString()
            + (today.getMonth() + 1).toString().padStart(2, '0')
            + today.getDate().toString().padStart(2, '0');

        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const invoiceCountToday = await prisma.invoice.count({
            where: {
                created_at: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            }
        });

        const seq = (invoiceCountToday + 1).toString().padStart(4, '0');
        const invoice_number = `INV-${dateStr}-${seq}`;

        // Calculate subtotal and total
        const subtotal = data.items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
        );
        const total = subtotal + (data.tax || 0) - (data.discount || 0);

        // Execute in transaction
        const invoice = await prisma.$transaction(async (tx) => {
            // Create invoice
            const createdInvoice = await tx.invoice.create({
                data: {
                    id_factory: data.id_factory,
                    id_customer: data.id_customer,
                    id_user: userId,
                    invoice_number,
                    invoice_date: data.invoice_date,
                    due_date: data.due_date,
                    subtotal,
                    tax: data.tax || 0,
                    discount: data.discount || 0,
                    total,
                    status: Invoice_status_enum.DRAFT,
                    notes: data.notes
                }
            });

            // Create invoice items and deduct stock
            for (const item of data.items) {
                const itemSubtotal = item.quantity * item.unit_price;

                await tx.invoiceItem.create({
                    data: {
                        id_invoice: createdInvoice.id,
                        id_product_type: item.id_product_type,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: itemSubtotal
                    }
                });

                // Get product type to retrieve code for stock deduction
                const productType = await tx.productType.findUnique({
                    where: { id: item.id_product_type }
                });

                if (productType) {
                    await stockService.removeStock(
                        data.id_factory,
                        productType.code,
                        Number(item.quantity),
                        userId,
                        'INVOICE',
                        createdInvoice.id,
                        tx
                    );
                }
            }

            return createdInvoice;
        });

        // Return invoice with all relations
        return await invoiceRepository.findById(invoice.id);
    }

    /**
     * Update an existing invoice
     */
    async updateInvoice(
        id: number,
        data: {
            invoice_date?: string | Date;
            due_date?: string | Date;
            tax?: number;
            discount?: number;
            notes?: string;
            status?: Invoice_status_enum;
        },
        userId: number
    ) {
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            throw new NotFoundError('Invoice', id);
        }

        if (invoice.status === Invoice_status_enum.CANCELLED) {
            throw new BusinessRuleError('Cannot edit cancelled invoice');
        }

        // Build update data
        const updateData: any = {};
        if (data.invoice_date !== undefined) updateData.invoice_date = data.invoice_date;
        if (data.due_date !== undefined) updateData.due_date = data.due_date;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.status !== undefined) updateData.status = data.status;

        // Handle tax and discount recalculation
        const newTax = data.tax !== undefined ? data.tax : Number(invoice.tax);
        const newDiscount = data.discount !== undefined ? data.discount : Number(invoice.discount);

        if (data.tax !== undefined) updateData.tax = data.tax;
        if (data.discount !== undefined) updateData.discount = data.discount;

        if (data.tax !== undefined || data.discount !== undefined) {
            updateData.total = Number(invoice.subtotal) + newTax - newDiscount;
        }

        await prisma.invoice.update({ where: { id }, data: updateData });

        // If status changed to CANCELLED, reverse stock
        if (data.status === Invoice_status_enum.CANCELLED) {
            await this.cancelInvoice(id, userId);
        }

        return await invoiceRepository.findById(id);
    }

    /**
     * Cancel an invoice and reverse stock
     */
    async cancelInvoice(id: number, userId: number) {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                InvoiceItem: {
                    include: { ProductType: true }
                }
            }
        });

        if (!invoice) {
            throw new NotFoundError('Invoice', id);
        }

        if (invoice.status === Invoice_status_enum.CANCELLED) {
            return invoice;
        }

        // Execute in transaction
        return await prisma.$transaction(async (tx) => {
            // Reverse stock for all items
            for (const item of invoice.InvoiceItem) {
                await stockService.addStock(
                    invoice.id_factory,
                    item.ProductType.code,
                    Number(item.quantity),
                    userId,
                    'INVOICE_CANCELLED',
                    invoice.id,
                    tx
                );
            }

            // Update status
            return await tx.invoice.update({
                where: { id },
                data: { status: Invoice_status_enum.CANCELLED }
            });
        });
    }

    /**
     * Delete an invoice with stock reversal
     */
    async deleteInvoice(id: number, userId: number) {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                InvoiceItem: {
                    include: { ProductType: true }
                }
            }
        });

        if (!invoice) {
            throw new NotFoundError('Invoice', id);
        }

        // Execute in transaction
        await prisma.$transaction(async (tx) => {
            // Reverse stock if invoice is not cancelled
            if (invoice.status !== Invoice_status_enum.CANCELLED) {
                for (const item of invoice.InvoiceItem) {
                    await stockService.addStock(
                        invoice.id_factory,
                        item.ProductType.code,
                        Number(item.quantity),
                        userId,
                        'INVOICE_REVERSAL',
                        invoice.id,
                        tx
                    );
                }
            }

            // Delete in order: payments -> items -> invoice
            await tx.payment.deleteMany({ where: { id_invoice: id } });
            await tx.invoiceItem.deleteMany({ where: { id_invoice: id } });
            await tx.invoice.delete({ where: { id } });
        });

        return { message: 'Invoice deleted successfully' };
    }

    /**
     * Add an item to an existing invoice
     */
    async addItem(
        invoiceId: number,
        itemData: { id_product_type: number; quantity: number; unit_price: number },
        userId: number
    ) {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) {
            throw new NotFoundError('Invoice', invoiceId);
        }

        if (invoice.status === Invoice_status_enum.CANCELLED) {
            throw new BusinessRuleError('Cannot add item to cancelled invoice');
        }

        // Get product type
        const productType = await prisma.productType.findUnique({
            where: { id: itemData.id_product_type }
        });
        if (!productType) {
            throw new NotFoundError('ProductType', itemData.id_product_type);
        }

        const itemSubtotal = itemData.quantity * itemData.unit_price;

        // Create the invoice item and update stock in transaction
        const createdItem = await prisma.$transaction(async (tx) => {
            const item = await tx.invoiceItem.create({
                data: {
                    id_invoice: invoiceId,
                    id_product_type: itemData.id_product_type,
                    quantity: itemData.quantity,
                    unit_price: itemData.unit_price,
                    subtotal: itemSubtotal
                }
            });

            // Recalculate invoice subtotal and total
            const allItems = await tx.invoiceItem.findMany({ where: { id_invoice: invoiceId } });
            const newSubtotal = allItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
            const newTotal = newSubtotal + Number(invoice.tax) - Number(invoice.discount);

            await tx.invoice.update({
                where: { id: invoiceId },
                data: { subtotal: newSubtotal, total: newTotal }
            });

            // Deduct stock
            await stockService.removeStock(
                invoice.id_factory,
                productType.code,
                Number(itemData.quantity),
                userId,
                'INVOICE',
                invoiceId,
                tx
            );

            return item;
        });

        return createdItem;
    }

    /**
     * Remove an item from an invoice
     */
    async removeItem(itemId: number, userId: number) {
        const item = await prisma.invoiceItem.findUnique({
            where: { id: itemId },
            include: {
                Invoice: true,
                ProductType: true
            }
        });

        if (!item) {
            throw new NotFoundError('InvoiceItem', itemId);
        }

        // Reverse stock and delete item in transaction
        await prisma.$transaction(async (tx) => {
            // Reverse stock
            await stockService.addStock(
                item.Invoice.id_factory,
                item.ProductType.code,
                Number(item.quantity),
                userId,
                'INVOICE_REVERSAL',
                item.Invoice.id,
                tx
            );

            // Delete the item
            await tx.invoiceItem.delete({ where: { id: itemId } });

            // Recalculate invoice subtotal and total
            const remainingItems = await tx.invoiceItem.findMany({
                where: { id_invoice: item.Invoice.id }
            });
            const newSubtotal = remainingItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
            const newTotal = newSubtotal + Number(item.Invoice.tax) - Number(item.Invoice.discount);

            await tx.invoice.update({
                where: { id: item.Invoice.id },
                data: { subtotal: newSubtotal, total: newTotal }
            });
        });

        return { message: 'Invoice item deleted successfully' };
    }

    /**
     * Add a payment to an invoice
     */
    async addPayment(
        invoiceId: number,
        paymentData: {
            payment_date: string | Date;
            amount: number;
            payment_method: Payment_payment_method_enum;
            reference_number?: string;
            notes?: string;
        },
        userId: number
    ) {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) {
            throw new NotFoundError('Invoice', invoiceId);
        }

        if (invoice.status === Invoice_status_enum.CANCELLED) {
            throw new BusinessRuleError('Cannot add payment to cancelled invoice');
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                id_invoice: invoiceId,
                id_user: userId,
                ...paymentData
            }
        });

        // Calculate total paid
        const aggregate = await prisma.payment.aggregate({
            where: { id_invoice: invoiceId },
            _sum: { amount: true }
        });
        const totalPaid = Number(aggregate._sum.amount || 0);

        // Auto-update invoice status
        let newStatus: Invoice_status_enum;
        if (totalPaid >= Number(invoice.total)) {
            newStatus = Invoice_status_enum.PAID;
        } else if (totalPaid > 0) {
            newStatus = Invoice_status_enum.PARTIAL;
        } else {
            newStatus = invoice.status as Invoice_status_enum;
        }

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus }
        });

        // Return payment with User relation
        return await prisma.payment.findUnique({
            where: { id: payment.id },
            include: { User: true }
        });
    }

    /**
     * Delete a payment from an invoice
     */
    async deletePayment(paymentId: number, userId: number) {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: { Invoice: true }
        });

        if (!payment) {
            throw new NotFoundError('Payment', paymentId);
        }

        // Delete the payment
        await prisma.payment.delete({ where: { id: paymentId } });

        // Recalculate total paid
        const aggregate = await prisma.payment.aggregate({
            where: { id_invoice: payment.id_invoice },
            _sum: { amount: true }
        });
        const totalPaid = Number(aggregate._sum.amount || 0);

        // Update invoice status
        let newStatus: Invoice_status_enum;
        if (totalPaid >= Number(payment.Invoice.total)) {
            newStatus = Invoice_status_enum.PAID;
        } else if (totalPaid > 0) {
            newStatus = Invoice_status_enum.PARTIAL;
        } else {
            // Keep existing status if it was DRAFT or SENT, otherwise default to DRAFT
            const currentStatus = payment.Invoice.status as Invoice_status_enum;
            if (currentStatus === Invoice_status_enum.DRAFT || currentStatus === Invoice_status_enum.SENT) {
                newStatus = currentStatus;
            } else {
                newStatus = Invoice_status_enum.DRAFT;
            }
        }

        await prisma.invoice.update({
            where: { id: payment.id_invoice },
            data: { status: newStatus }
        });

        return { message: 'Payment deleted successfully' };
    }
}

// Singleton instance
export const invoiceService = new InvoiceService();
