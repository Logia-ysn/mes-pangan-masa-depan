import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { workOrderService } from "../src/services/work-order.service";

export const t_getWorkOrders = apiWrapper(async (req, res) => {
    const user = await requireAuth(req);
    const { limit, offset, status, priority, id_production_line, start_date, end_date } = req.query as any;
    const result = await workOrderService.getWorkOrders({
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
        id_factory: user.id_factory || undefined,
        status,
        priority,
        id_production_line: id_production_line ? Number(id_production_line) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
    });
    return { data: result.workOrders, total: result.total };
});
