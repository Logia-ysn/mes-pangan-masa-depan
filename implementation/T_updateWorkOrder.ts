import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_updateWorkOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const id = Number(req.params.id);
    const result = await workOrderService.updateWorkOrder({ id, ...req.body as any }, user.id);
    return { message: 'Work Order berhasil diperbarui', data: result };
});
