import { T_removeMachineFromLine } from "../types/api/T_removeMachineFromLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_removeMachineFromLine: T_removeMachineFromLine = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    await productionLineService.removeMachine(
        req.path.id,
        req.path.machineId,
        user.id
    );
    return { success: true };
});
