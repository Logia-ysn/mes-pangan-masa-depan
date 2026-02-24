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
    async generateInvoicePDF(invoiceId: number): Promise<Buffer> {
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

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Invoice ${invoice.invoice_number}`,
                    Author: 'ERP Pangan Masa Depan',
                },
            });

            const chunks: any[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

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

            // ===== STATUS WATERMARK & STAMP =====
            const genWatermark = (text: string, color: string) => {
                doc.save();
                doc.opacity(0.1);
                doc.fontSize(80).font('Helvetica-Bold').fillColor(color);
                doc.translate(doc.page.width / 2, doc.page.height / 2).rotate(-45, { origin: [0, 0] });
                doc.text(text, -200, -40, { width: 400, align: 'center' });
                doc.restore();

                // Small stamp in corner
                doc.save();
                doc.roundedRect(420, 20, 130, 40, 5).lineWidth(2).strokeColor(color).stroke();
                doc.fontSize(14).font('Helvetica-Bold').fillColor(color).text(text, 420, 32, { width: 130, align: 'center' });
                doc.restore();
            };

            const invoiceStatusMeta: Record<string, { color: string, text: string }> = {
                'DRAFT': { color: '#94a3b8', text: 'DRAFT' },
                'SENT': { color: '#f59e0b', text: 'SENT' },
                'PAID': { color: '#22c55e', text: 'PAID' },
                'PARTIAL': { color: '#3b82f6', text: 'PARTIAL' },
                'CANCELLED': { color: '#ef4444', text: 'CANCEL' },
            };
            const invMeta = invoiceStatusMeta[invoice.status] || { color: '#94a3b8', text: invoice.status };
            genWatermark(invMeta.text, invMeta.color);


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

        });
    }

    async generateReceiptPDF(receiptId: number): Promise<Buffer> {
        const receipt = await prisma.materialReceipt.findUnique({
            where: { id: receiptId },
            include: {
                Supplier: true,
                Factory: true,
                User: { select: { fullname: true, email: true, role: true } },
                Approver: { select: { fullname: true, email: true, role: true } },
                PaidByUser: { select: { fullname: true, email: true, role: true } },
                ProductType: true,
                StockMovement: {
                    include: {
                        RawMaterialQualityAnalysis: true
                    }
                }
            }
        });

        if (!receipt) {
            throw new NotFoundError('MaterialReceipt', receiptId);
        }

        const qc = receipt.StockMovement?.RawMaterialQualityAnalysis?.[0];

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Tanda Terima ${receipt.receipt_number}`,
                    Author: 'ERP Pangan Masa Depan',
                },
            });

            const chunks: any[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 100;
            const leftX = 50;
            const rightX = doc.page.width - 50;

            // ===== STATUS WATERMARK & STAMP =====
            const statusMeta: Record<string, { color: string, text: string }> = {
                'WAITING_APPROVAL': { color: '#94a3b8', text: 'DRAFT' },
                'APPROVED': { color: '#22c55e', text: 'APPROVED' },
                'PAID': { color: '#3b82f6', text: 'PAID' }
            };

            const meta = statusMeta[receipt.status] || { color: '#94a3b8', text: receipt.status };

            // Diagonal watermark
            doc.save();
            doc.opacity(0.1);
            doc.fontSize(80).font('Helvetica-Bold').fillColor(meta.color);
            doc.translate(doc.page.width / 2, doc.page.height / 2).rotate(-45, { origin: [0, 0] });
            doc.text(meta.text, -200, -40, { width: 400, align: 'center' });
            doc.restore();

            // Corner digital stamp
            if (receipt.status === 'APPROVED' || receipt.status === 'PAID') {
                const actionBy = receipt.status === 'PAID' ? receipt.PaidByUser?.fullname : receipt.Approver?.fullname;
                const actionAt = receipt.status === 'PAID' ? receipt.paid_at : receipt.approved_at;

                doc.save();
                doc.roundedRect(380, 40, 170, 60, 5).lineWidth(2).strokeColor(meta.color).stroke();
                doc.fontSize(18).font('Helvetica-Bold').fillColor(meta.color).text(meta.text, 380, 48, { width: 170, align: 'center' });
                doc.fontSize(7).font('Helvetica').fillColor('#666666').text(`Oleh: ${actionBy || '-'}`, 380, 70, { width: 170, align: 'center' });
                doc.fontSize(7).text(`Tgl: ${formatDate(actionAt)}`, 380, 82, { width: 170, align: 'center' });
                doc.restore();
            } else {
                // Draft stamp
                doc.save();
                doc.roundedRect(420, 30, 130, 40, 5).lineWidth(2).strokeColor(meta.color).stroke();
                doc.fontSize(16).font('Helvetica-Bold').fillColor(meta.color).text(meta.text, 420, 42, { width: 130, align: 'center' });
                doc.restore();
            }


            // ===== HEADER =====
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('TANDA TERIMA BAHAN BAKU', leftX, 50);
            doc.fontSize(9).font('Helvetica').fillColor('#666666')
                .text('ERP Pangan Masa Depan', leftX, 70);

            // Divider
            doc.moveTo(leftX, 110).lineTo(rightX, 110).strokeColor('#cccccc').lineWidth(1).stroke();

            // ===== INFO SECTION =====
            let y = 125;

            // Left column — Supplier
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#999999').text('DARI SUPPLIER', leftX, y);
            y += 14;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
                .text(receipt.Supplier?.name || '-', leftX, y);
            y += 15;
            if (receipt.Supplier?.phone) {
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                    .text(`Telp: ${receipt.Supplier.phone}`, leftX, y);
                y += 13;
            }
            if (receipt.Supplier?.address) {
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                    .text(receipt.Supplier.address, leftX, y, { width: 220 });
            }

            // Right column — Receipt details
            const rightColX = 320;
            let ry = 125;

            const addInfoRow = (label: string, value: string) => {
                doc.fontSize(8).font('Helvetica').fillColor('#999999')
                    .text(label, rightColX, ry, { width: 90 });
                doc.fontSize(9).font('Helvetica').fillColor('#000000')
                    .text(value, rightColX + 90, ry, { width: 140 });
                ry += 16;
            };

            addInfoRow('NO. PENERIMAAN', receipt.receipt_number);
            addInfoRow('KODE BATCH', receipt.batch_code);
            addInfoRow('TANGGAL', formatDate(receipt.receipt_date));
            addInfoRow('PABRIK', receipt.Factory?.name || '-');
            addInfoRow('OPERATOR', receipt.User?.fullname || '-');

            // ===== DETAIL TABLE =====
            y = Math.max(y, ry) + 25;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Rincian Penerimaan', leftX, y);
            y += 15;

            const colX = {
                product: leftX,
                grade: leftX + 150,
                qty: leftX + 220,
                price: leftX + 290,
                subtotal: rightX - 90,
            };

            doc.rect(leftX, y, pageWidth, 20).fill('#f5f5f5');
            y += 5;
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
            doc.text('Produk', colX.product + 4, y, { width: 140 });
            doc.text('Grade QC', colX.grade, y, { width: 60 });
            doc.text('Kuantitas', colX.qty, y, { width: 60, align: 'right' });
            doc.text('Harga (Rp)', colX.price, y, { width: 80, align: 'right' });
            doc.text('Subtotal', colX.subtotal, y, { width: 90, align: 'right' });
            y += 20;

            doc.fontSize(9).font('Helvetica').fillColor('#000000');
            doc.text(receipt.ProductType?.name || '-', colX.product + 4, y, { width: 140 });
            doc.text(qc?.final_grade || '-', colX.grade, y, { width: 60 });
            doc.text(`${Number(receipt.quantity).toLocaleString('id-ID')} kg`, colX.qty, y, { width: 60, align: 'right' });
            doc.text(formatCurrency(receipt.unit_price), colX.price, y, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').text(formatCurrency(Number(receipt.quantity) * Number(receipt.unit_price)), colX.subtotal, y, { width: 90, align: 'right' });
            y += 25;

            if (Number(receipt.other_costs) > 0) {
                doc.fontSize(9).font('Helvetica').fillColor('#666666')
                    .text('Biaya Lain-lain', colX.price, y, { width: 80, align: 'right' });
                doc.font('Helvetica-Bold').fillColor('#000000')
                    .text(formatCurrency(receipt.other_costs), colX.subtotal, y, { width: 90, align: 'right' });
                y += 20;
            }

            doc.moveTo(colX.price, y).lineTo(rightX, y).strokeColor('#000000').lineWidth(1).stroke();
            y += 8;
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
                .text('TOTAL', colX.price, y, { width: 80, align: 'right' });
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
                .text(formatCurrency(receipt.total_amount), colX.subtotal, y, { width: 90, align: 'right' });
            y += 30;

            // ===== QC DATA =====
            if (qc) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000').text('Data Quality Control', leftX, y);
                y += 15;

                const qcData = [
                    { label: 'Moisture (%)', value: qc.moisture_value ? Number(qc.moisture_value).toFixed(1) : '-' },
                    { label: 'Moisture Grade', value: qc.moisture_grade || '-' },
                    { label: 'Density (g/ml)', value: qc.density_value ? Number(qc.density_value).toFixed(3) : '-' },

                    { label: 'Density Grade', value: qc.density_grade || '-' },
                    { label: 'Butir Hijau (%)', value: qc.green_percentage ? Number(qc.green_percentage).toFixed(1) : '-' },
                    { label: 'Butir Merah (%)', value: qc.red_percentage ? Number(qc.red_percentage).toFixed(1) : '-' },
                    { label: 'Butir Kuning (%)', value: qc.yellow_percentage ? Number(qc.yellow_percentage).toFixed(1) : '-' },
                    { label: 'Color Grade', value: qc.color_grade || '-' },
                ];

                let xOffset = leftX;
                qcData.forEach((item, index) => {
                    doc.fontSize(8).font('Helvetica').fillColor('#666666').text(item.label, xOffset, y, { width: 80 });
                    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000').text(item.value, xOffset, y + 12, { width: 80 });

                    xOffset += 85;
                    if ((index + 1) % 4 === 0) {
                        xOffset = leftX;
                        y += 35;
                    }
                });
                if (qcData.length % 4 !== 0) y += 35;
            }

            // ===== PAYMENT INFO =====
            if (receipt.status === 'PAID') {
                doc.rect(leftX, y, pageWidth, 45).fill('#f0f9ff').stroke('#bae6fd');
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#0369a1').text('INFORMASI PEMBAYARAN', leftX + 10, y + 10);
                doc.fontSize(8).font('Helvetica').fillColor('#0284c7')
                    .text(`Tgl Bayar: ${formatDate(receipt.paid_at)} | Metode: ${receipt.payment_method} | Ref: ${receipt.payment_reference || '-'}`, leftX + 10, y + 25);
                y += 65;
            } else {
                y += 20; // padding
            }

            // ===== NOTES (Added if y is low) =====
            if (receipt.notes && y < 700) {
                y += 10;
                doc.fontSize(8).font('Helvetica').fillColor('#999999').text('CATATAN:', leftX, y);
                doc.fontSize(9).font('Helvetica').fillColor('#333333').text(receipt.notes, leftX + 50, y, { width: pageWidth - 50 });
                y += 20;
            }


            // ===== FOOTER =====
            const footerY = doc.page.height - 40;
            doc.fontSize(7).font('Helvetica').fillColor('#aaaaaa')
                .text(
                    `Dokumen tercetak pada ${formatDate(new Date())} | Otomatis oleh Sistem ERP PMD`,
                    leftX, footerY, { width: pageWidth, align: 'center' }
                );

            doc.end();
        });
    }
}

export const pdfService = new PDFService();
