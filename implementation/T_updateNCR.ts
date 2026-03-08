import { T_updateNCR } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";

export const t_updateNCR: T_updateNCR = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const id = Number(req.params.id);
    const body = req.body;

    return await ncrService.updateReport(id, {
        issue_title: body.issue_title,
        description: body.description,
        severity: body.severity as any,
        status: body.status as any,
        id_worksheet: body.id_worksheet ? Number(body.id_worksheet) : undefined,
        batch_code: body.batch_code,
    }, user.id);
});
