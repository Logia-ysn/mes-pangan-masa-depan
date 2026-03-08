import { T_createDowntimeEvent } from "../types/api/T_createDowntimeEvent";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_createDowntimeEvent: T_createDowntimeEvent = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');

    const body = req.body as any;
    const result = await downtimeEventService.createDowntimeEvent({
        id_machine: Number(body.id_machine),
        id_factory: Number(body.id_factory),
        start_time: String(body.start_time),
        end_time: body.end_time ? String(body.end_time) : undefined,
        category: body.category,
        reason: body.reason,
        id_user: user.id
    }, user.id);

    return result;
});
