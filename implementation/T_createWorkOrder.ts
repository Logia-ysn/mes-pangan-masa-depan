import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_createWorkOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const result = await workOrderService.createWorkOrder({
        ...req.body as any,
        id_factory: user.id_factory,
        id_user: user.id
    });
    return { message: 'Work Order berhasil dibuat', data: result };
});
