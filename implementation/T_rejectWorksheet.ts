import { requireAuth } from "../utility/auth";
import { worksheetService } from "../src/services/worksheet.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_rejectWorksheet = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const id = parseInt(req.params?.id || (req as any).path?.id);
    const { reason } = (req as any).body || {};

    if (!id || isNaN(id)) {
        throw new Error('Worksheet ID is required');
    }

    if (!reason || reason.trim().length === 0) {
        throw new Error('Alasan penolakan wajib diisi');
    }

    const worksheet = await worksheetService.rejectWorksheet(id, user.id, reason);
    return worksheet;
});
