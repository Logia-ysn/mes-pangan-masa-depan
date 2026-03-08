import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_deleteWorkOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');
    const id = Number(req.params.id);
    await workOrderService.deleteWorkOrder(id, user.id);
    return { message: 'Work Order berhasil dihapus' };
});
