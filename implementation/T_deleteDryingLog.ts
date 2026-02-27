import { T_deleteDryingLog } from "../types/api/T_deleteDryingLog";
import { dryingLogService } from "../src/services/drying-log.service";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_deleteDryingLog: T_deleteDryingLog = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const id = Number(req.path?.id || req.query?.id);

    if (!id || isNaN(id)) {
        throw new Error('Drying Log ID is required');
    }

    await dryingLogService.delete(id, user.id);
    return { success: true } as any;
});
