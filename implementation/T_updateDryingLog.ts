import { T_updateDryingLog } from "../types/api/T_updateDryingLog";
import { dryingLogService } from "../src/services/drying-log.service";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_updateDryingLog: T_updateDryingLog = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const { id, ...dto } = req.body;

    const dryingLog = await dryingLogService.update({
        id: Number(id),
        id_user: user.id,
        ...dto
    });

    return dryingLog as any;
});
