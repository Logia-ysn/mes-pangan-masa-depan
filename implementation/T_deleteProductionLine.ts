import { T_deleteProductionLine } from "../types/api/T_deleteProductionLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_deleteProductionLine: T_deleteProductionLine = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    await productionLineService.delete(req.path.id, user.id);
    return { success: true };
});
