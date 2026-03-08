import { T_updateDowntimeEvent } from "../types/api/T_updateDowntimeEvent";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_updateDowntimeEvent: T_updateDowntimeEvent = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');

    const { id } = req.params;
    const body = req.body as any;

    const result = await downtimeEventService.updateDowntimeEvent({
        id: Number(id),
        id_machine: body.id_machine ? Number(body.id_machine) : undefined,
        start_time: body.start_time ? String(body.start_time) : undefined,
        end_time: body.end_time ? String(body.end_time) : undefined,
        category: body.category,
        reason: body.reason,
    }, user.id);

    return result;
});
