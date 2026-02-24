import { T_getMaterialReceiptPdf } from "../types/api/T_getMaterialReceiptPdf";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { pdfService } from "../src/services/pdf.service";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_getMaterialReceiptPdf: T_getMaterialReceiptPdf = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const receiptId = Number(req.path.id);
    const receipt = await materialReceiptService.getById(receiptId);

    const pdfBuffer = await pdfService.generateReceiptPDF(receiptId);

    // Convert to regular Response properties for sending binary data
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt_${receipt.receipt_number}.pdf"`);
    res.send(pdfBuffer);

    // Special return indicating response is already handled by apiWrapper
    return { __skip_response: true } as any;
});
