import { T_getMaterialReceiptPdf } from "../types/api/T_getMaterialReceiptPdf";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { pdfService } from "../src/services/pdf.service";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_getMaterialReceiptPdf: T_getMaterialReceiptPdf = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const receiptId = Number(req.path?.id || req.params?.id);
    if (!receiptId || isNaN(receiptId)) {
        res.status(400).json({ success: false, error: { message: 'Invalid receipt ID' } });
        return;
    }

    const receipt = await materialReceiptService.getById(receiptId);
    const pdfBuffer = await pdfService.generateReceiptPDF(receiptId);

    const filename = `${receipt.batch_code || receipt.receipt_number || `receipt-${receiptId}`}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    return { __skip_response: true } as any;
});
