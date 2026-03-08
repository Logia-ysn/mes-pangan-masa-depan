import { T_createNCR } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";
import { NCR_severity_enum } from "@prisma/client";

export const t_createNCR: T_createNCR = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const body = req.body;

    return await ncrService.createReport({
        id_factory: Number(body.id_factory),
        report_date: new Date(body.report_date),
        issue_title: body.issue_title,
        description: body.description,
        severity: body.severity as NCR_severity_enum,
        id_worksheet: body.id_worksheet ? Number(body.id_worksheet) : undefined,
        batch_code: body.batch_code,
        reported_by: user.id
    }, user.id);
});
