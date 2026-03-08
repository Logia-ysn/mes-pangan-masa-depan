import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

// DELETE /work-orders/:id/worksheets/:worksheetId
export const t_removeWorksheetFromOrder = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const workOrderId = Number(req.params.id);
    const worksheetId = Number(req.params.worksheetId);
    await workOrderService.removeWorksheetFromOrder(workOrderId, worksheetId, user.id);
    return { message: 'Worksheet berhasil dilepas dari Work Order' };
});
