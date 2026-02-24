import { requireAuth } from "../utility/auth";
import { worksheetService } from "../src/services/worksheet.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_submitWorksheet = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const id = parseInt(req.params?.id || (req as any).path?.id);

    if (!id || isNaN(id)) {
        throw new Error('Worksheet ID is required');
    }

    const worksheet = await worksheetService.submitWorksheet(id, user.id);
    return worksheet;
});
