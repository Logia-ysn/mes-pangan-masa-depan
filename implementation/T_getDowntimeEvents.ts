import { T_getDowntimeEvents } from "../types/api/T_getDowntimeEvents";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_getDowntimeEvents: T_getDowntimeEvents = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const { limit, offset, id_machine, id_factory, category, status, start_date, end_date } = req.query as any;

    const params: any = {};
    if (limit) params.limit = Number(limit);
    if (offset) params.offset = Number(offset);
    if (id_machine) params.id_machine = Number(id_machine);
    if (id_factory) params.id_factory = Number(id_factory);
    if (category) params.category = category;
    if (status) params.status = status;
    if (start_date) params.start_date = new Date(String(start_date));
    if (end_date) params.end_date = new Date(String(end_date));

    const result = await downtimeEventService.getDowntimeEvents(params);

    return {
        total: result.total,
        data: result.downtimeEvents
    };
});
