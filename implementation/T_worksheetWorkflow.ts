import { getUserFromToken } from "../utility/auth";
import { worksheetService } from "../src/services/worksheet.service";
import { AppError } from "../src/utils/errors";

const getWorksheetId = (req: any): number => {
    const id = parseInt(req.params?.id || req.query?.id);
    if (!id || isNaN(id)) throw new Error('Worksheet ID tidak valid');
    return id;
};

const sendError = (res: any, error: any) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Terjadi kesalahan' }
    });
};

export const t_submitWorksheet = async (req: any, res: any) => {
    try {
        const user = await getUserFromToken(req);
        const id = getWorksheetId(req);
        const worksheet = await worksheetService.submitWorksheet(id, user.id);
        res.json({ success: true, data: worksheet });
    } catch (e: any) { sendError(res, e); }
};

export const t_approveWorksheet = async (req: any, res: any) => {
    try {
        const user = await getUserFromToken(req);
        const id = getWorksheetId(req);
        const worksheet = await worksheetService.approveWorksheet(id, user.id);
        res.json({ success: true, data: worksheet });
    } catch (e: any) { sendError(res, e); }
};

export const t_rejectWorksheet = async (req: any, res: any) => {
    try {
        const user = await getUserFromToken(req);
        const id = getWorksheetId(req);
        const body = req.body || {};
        const reason = body.reason?.trim();
        if (!reason) {
            return res.status(400).json({ success: false, error: { message: 'Alasan penolakan wajib diisi' } });
        }
        const worksheet = await worksheetService.rejectWorksheet(id, user.id, reason);
        res.json({ success: true, data: worksheet });
    } catch (e: any) { sendError(res, e); }
};

export const t_cancelWorksheet = async (req: any, res: any) => {
    try {
        const user = await getUserFromToken(req);
        const id = getWorksheetId(req);
        const body = req.body || {};
        const worksheet = await worksheetService.cancelWorksheet(id, user.id, body.reason);
        res.json({ success: true, data: worksheet });
    } catch (e: any) { sendError(res, e); }
};
