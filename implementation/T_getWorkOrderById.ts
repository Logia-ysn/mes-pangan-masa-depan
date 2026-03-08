import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_getWorkOrderById = apiWrapper(async (req, res) => {
    await requireAuth(req);
    const id = Number(req.params.id);
    const result = await workOrderService.getWorkOrderById(id);
    return { data: result };
});
