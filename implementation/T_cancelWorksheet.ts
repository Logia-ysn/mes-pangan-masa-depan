import { requireAuth } from "../utility/auth";
import { worksheetService } from "../src/services/worksheet.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_cancelWorksheet = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');
    const id = parseInt(req.params?.id || (req as any).path?.id);
    const { reason } = (req as any).body || {};

    if (!id || isNaN(id)) {
        throw new Error('Worksheet ID is required');
    }

    const worksheet = await worksheetService.cancelWorksheet(id, user.id, reason);
    return worksheet;
});
