import { T_createProductionLine } from "../types/api/T_createProductionLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_createProductionLine: T_createProductionLine = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_factory, code, name, description, capacity_per_hour } = req.body as any;
    return await productionLineService.create(
        { id_factory, code, name, description, capacity_per_hour },
        user.id
    );
});
