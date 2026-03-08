import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_workOrderWorkflow = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const id = Number(req.params.id);
    const { action, actual_quantity, reason } = req.body as any;

    let result;
    switch (action) {
        case 'start':
            result = await workOrderService.startWorkOrder(id, user.id);
            return { message: 'Work Order dimulai', data: result };
        case 'complete':
            result = await workOrderService.completeWorkOrder(id, user.id, actual_quantity);
            return { message: 'Work Order selesai', data: result };
        case 'cancel':
            result = await workOrderService.cancelWorkOrder(id, user.id, reason);
            return { message: 'Work Order dibatalkan', data: result };
        default:
            throw new Error(`Unknown workflow action: ${action}`);
    }
});
