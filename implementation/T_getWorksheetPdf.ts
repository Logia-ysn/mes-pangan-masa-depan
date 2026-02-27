import { T_getWorksheetPdf } from "../types/api/T_getWorksheetPdf";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { pdfService } from "../src/services/pdf.service";
import { worksheetService } from "../src/services/worksheet.service";

export const t_getWorksheetPdf: T_getWorksheetPdf = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const worksheetId = Number(req.path.id);
    const worksheet = await worksheetService.getWorksheetById(worksheetId);

    const pdfBuffer = await pdfService.generateWorksheetPDF(worksheetId);

    const filename = `worksheet_${worksheet.batch_code || worksheet.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);

    return { __skip_response: true } as any;
});
