import { T_resolveNCR } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";

export const t_resolveNCR: T_resolveNCR = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const id = Number(req.params.id);
    const body = req.body;

    return await ncrService.resolveReport(id, {
        action_plan: body.action_plan,
        action_taken: body.action_taken,
        status: body.status as any
    }, user.id);
});
