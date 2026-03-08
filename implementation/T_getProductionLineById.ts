import { T_getProductionLineById } from "../types/api/T_getProductionLineById";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineRepository } from "../src/repositories/production-line.repository";

export const t_getProductionLineById: T_getProductionLineById = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const line = await productionLineRepository.findByIdWithMachines(req.path.id);
    if (!line) throw new Error('Production line not found');
    return line;
});
