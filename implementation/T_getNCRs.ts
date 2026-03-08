import { T_getNCRs } from "../types/api/ncr.types";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { ncrService } from "../src/services/ncr.service";

export const t_getNCRs: T_getNCRs = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_factory, status, severity } = req.query;

    return await ncrService.getReports({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        id_factory: id_factory ? Number(id_factory) : undefined,
        status: status ? String(status) : undefined,
        severity: severity ? String(severity) : undefined,
    });
});
