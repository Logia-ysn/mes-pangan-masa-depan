import { T_updateProductionLine } from "../types/api/T_updateProductionLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_updateProductionLine: T_updateProductionLine = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { code, name, description, is_active, capacity_per_hour } = req.body as any;
    return await productionLineService.update(
        req.path.id,
        { code, name, description, is_active, capacity_per_hour },
        user.id
    );
});
