/**
 * PDF Service
 * Generates PDF documents for invoices
 */

import PDFDocument from 'pdfkit';
import { prisma } from '../libs/prisma';
import { NotFoundError } from '../utils/errors';

const formatCurrency = (val: number | any): string => {
    const num = typeof val === 'number' ? val : Number(val || 0);
    return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDate = (d: Date | string | null): string => {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const paymentMethodLabel: Record<string, string> = {
    CASH: 'Tunai',
    TRANSFER: 'Transfer Bank',
    CHECK: 'Cek',
    GIRO: 'Giro',
};

const statusLabel: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Terkirim',
    PAID: 'Lunas',
    PARTIAL: 'Sebagian Dibayar',
    CANCELLED: 'Dibatalkan',
};

class PDFService {
    async generateInvoicePDF(invoiceId: number): Promise<PDFKit.PDFDocument> {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                Customer: true,
                Factory: true,
                User: true,
                InvoiceItem: { include: { ProductType: true } },
                Payment: { include: { User: true }, orderBy: { payment_date: 'asc' } },
            },
        });

        if (!invoice) {
            throw new NotFoundError('Invoice', invoiceId);
        }

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Invoice ${invoice.invoice_number}`,
                Author: 'ERP Pangan Masa Depan',
            },
        });

        const pageWidth = doc.page.width - 100; // margins
        const leftX = 50;
        const rightX = doc.page.width - 50;

        // ===== HEADER =====
        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', leftX, 50);
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
            .text('ERP Pangan Masa Depan', leftX, 75);

        // Invoice info — right side
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
            .text(invoice.invoice_number, rightX - 200, 50, { width: 200, align: 'right' });
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
            .text(`Status: ${statusLabel[invoice.status] || invoice.status}`, rightX - 200, 67, { width: 200, align: 'right' });

        // Divider
        doc.moveTo(leftX, 95).lineTo(rightX, 95).strokeColor('#cccccc').lineWidth(1).stroke();

        // ===== INFO SECTION =====
        let y = 110;

        // Left column — Customer
        doc.fontSize(8).font('Helvetica').fillColor('#999999').text('TAGIHAN KEPADA', leftX, y);
        y += 14;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
            .text(invoice.Customer?.name || '-', leftX, y);
        y += 15;
        if (invoice.Customer?.code) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(`Kode: ${invoice.Customer.code}`, leftX, y);
            y += 13;
        }
        if (invoice.Customer?.phone) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(`Telp: ${invoice.Customer.phone}`, leftX, y);
            y += 13;
        }
        if (invoice.Customer?.email) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(`Email: ${invoice.Customer.email}`, leftX, y);
            y += 13;
        }
        if (invoice.Customer?.address) {
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(invoice.Customer.address, leftX, y, { width: 220 });
        }

        // Right column — Invoice details
        const rightColX = 340;
        let ry = 110;

        const addInfoRow = (label: string, value: string) => {
            doc.fontSize(8).font('Helvetica').fillColor('#999999')
                .text(label, rightColX, ry, { width: 100 });
            doc.fontSize(9).font('Helvetica').fillColor('#000000')
                .text(value, rightColX + 105, ry, { width: 110, align: 'right' });
            ry += 16;
        };

        addInfoRow('TANGGAL', formatDate(invoice.invoice_date));
        addInfoRow('JATUH TEMPO', formatDate(invoice.due_date));
        addInfoRow('PABRIK', invoice.Factory?.name || '-');
        addInfoRow('DIBUAT OLEH', invoice.User?.fullname || '-');

        // ===== ITEMS TABLE =====
        y = Math.max(y, ry) + 25;

        // Table header
        const colX = {
            no: leftX,
            product: leftX + 30,
            qty: leftX + 250,
            price: leftX + 320,
            subtotal: rightX - 90,
        };

        doc.rect(leftX, y, pageWidth, 22).fill('#f5f5f5');
        y += 6;
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
        doc.text('No', colX.no + 4, y, { width: 25 });
        doc.text('Produk', colX.product, y, { width: 200 });
        doc.text('Qty', colX.qty, y, { width: 60, align: 'right' });
        doc.text('Harga Satuan', colX.price, y, { width: 90, align: 'right' });
        doc.text('Subtotal', colX.subtotal, y, { width: 90, align: 'right' });
        y += 20;

        // Table rows
        const items = invoice.InvoiceItem || [];
        items.forEach((item, idx) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            const rowY = y;
            if (idx % 2 === 1) {
                doc.rect(leftX, rowY - 4, pageWidth, 20).fill('#fafafa');
            }

            doc.fontSize(9).font('Helvetica').fillColor('#000000');
            doc.text(String(idx + 1), colX.no + 4, rowY, { width: 25 });
            doc.text(
                `${item.ProductType?.name || '-'} (${item.ProductType?.code || ''})`,
                colX.product, rowY, { width: 210 }
            );
            doc.text(
                `${Number(item.quantity)} ${item.ProductType?.unit || 'kg'}`,
                colX.qty, rowY, { width: 60, align: 'right' }
            );
            doc.text(formatCurrency(item.unit_price), colX.price, rowY, { width: 90, align: 'right' });
            doc.font('Helvetica-Bold')
                .text(formatCurrency(item.subtotal), colX.subtotal, rowY, { width: 90, align: 'right' });

            y += 20;
        });

        // Table bottom line
        doc.moveTo(leftX, y + 2).lineTo(rightX, y + 2).strokeColor('#cccccc').lineWidth(0.5).stroke();
        y += 15;

        // ===== SUMMARY =====
        const summaryX = rightX - 210;
        const summaryValX = rightX - 100;
        const summaryW = 100;

        const addSummaryRow = (label: string, value: string, bold = false) => {
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text(label, summaryX, y, { width: 100 });
            doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor(bold ? '#000000' : '#333333')
                .text(value, summaryValX, y, { width: summaryW, align: 'right' });
            y += 16;
        };

        addSummaryRow('Subtotal', formatCurrency(invoice.subtotal));
        if (Number(invoice.tax) > 0) {
            addSummaryRow('Pajak', '+ ' + formatCurrency(invoice.tax));
        }
        if (Number(invoice.discount) > 0) {
            addSummaryRow('Diskon', '- ' + formatCurrency(invoice.discount));
        }

        // Total line
        doc.moveTo(summaryX, y).lineTo(rightX, y).strokeColor('#333333').lineWidth(1).stroke();
        y += 8;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
            .text('TOTAL', summaryX, y, { width: 100 });
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
            .text(formatCurrency(invoice.total), summaryValX, y, { width: summaryW, align: 'right' });
        y += 25;

        // ===== PAYMENTS SECTION =====
        const payments = invoice.Payment || [];
        if (payments.length > 0) {
            if (y > 650) {
                doc.addPage();
                y = 50;
            }

            doc.moveTo(leftX, y).lineTo(rightX, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
            y += 15;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
                .text('RIWAYAT PEMBAYARAN', leftX, y);
            y += 20;

            // Payment table header
            doc.rect(leftX, y, pageWidth, 20).fill('#f5f5f5');
            y += 5;
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
            doc.text('Tanggal', leftX + 4, y, { width: 100 });
            doc.text('Jumlah', leftX + 110, y, { width: 100, align: 'right' });
            doc.text('Metode', leftX + 220, y, { width: 80 });
            doc.text('No. Referensi', leftX + 310, y, { width: 100 });
            y += 19;

            let totalPaid = 0;
            payments.forEach((p) => {
                if (y > 740) {
                    doc.addPage();
                    y = 50;
                }

                doc.fontSize(9).font('Helvetica').fillColor('#000000');
                doc.text(formatDate(p.payment_date), leftX + 4, y, { width: 100 });
                doc.font('Helvetica-Bold')
                    .text(formatCurrency(p.amount), leftX + 110, y, { width: 100, align: 'right' });
                doc.font('Helvetica')
                    .text(paymentMethodLabel[p.payment_method] || p.payment_method, leftX + 220, y, { width: 80 });
                doc.text(p.reference_number || '-', leftX + 310, y, { width: 100 });
                totalPaid += Number(p.amount);
                y += 16;
            });

            // Payment summary
            doc.moveTo(leftX, y + 2).lineTo(rightX, y + 2).strokeColor('#cccccc').lineWidth(0.5).stroke();
            y += 12;

            const remaining = Number(invoice.total) - totalPaid;
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text('Total Dibayar:', leftX + 4, y, { width: 100 });
            doc.font('Helvetica-Bold').fillColor('#000000')
                .text(formatCurrency(totalPaid), leftX + 110, y, { width: 100, align: 'right' });
            y += 16;

            if (remaining > 0) {
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                    .text('Sisa Tagihan:', leftX + 4, y, { width: 100 });
                doc.font('Helvetica-Bold').fillColor('#cc0000')
                    .text(formatCurrency(remaining), leftX + 110, y, { width: 100, align: 'right' });
                y += 16;
            }
        }

        // ===== NOTES =====
        if (invoice.notes) {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            y += 10;
            doc.moveTo(leftX, y).lineTo(rightX, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
            y += 15;
            doc.fontSize(8).font('Helvetica').fillColor('#999999').text('CATATAN', leftX, y);
            y += 14;
            doc.fontSize(9).font('Helvetica').fillColor('#333333')
                .text(invoice.notes, leftX, y, { width: pageWidth });
        }

        // ===== FOOTER =====
        const footerY = doc.page.height - 60;
        doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
            .text(
                `Dicetak pada ${formatDate(new Date())} | ERP Pangan Masa Depan`,
                leftX, footerY, { width: pageWidth, align: 'center' }
            );

        doc.end();
        return doc;
    }
}

export const pdfService = new PDFService();
