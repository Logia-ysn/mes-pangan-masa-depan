import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

// POST /work-orders/:id/worksheets
export const t_addWorksheetToOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const workOrderId = Number(req.params.id);
    const { id_worksheet, step_number } = req.body as any;
    await workOrderService.addWorksheetToOrder(workOrderId, Number(id_worksheet), Number(step_number || 1), user.id);
    return { message: 'Worksheet berhasil ditambahkan ke Work Order' };
});

