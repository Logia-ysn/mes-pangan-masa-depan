import { T_assignMachineToLine } from "../types/api/T_assignMachineToLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_assignMachineToLine: T_assignMachineToLine = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_machine, sequence_order } = req.body as any;
    await productionLineService.assignMachine(
        req.path.id,
        Number(id_machine),
        sequence_order != null ? Number(sequence_order) : 0,
        user.id
    );
    return { success: true };
});
