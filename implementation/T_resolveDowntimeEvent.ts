import { T_resolveDowntimeEvent } from "../types/api/T_resolveDowntimeEvent";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_resolveDowntimeEvent: T_resolveDowntimeEvent = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');

    const { id } = req.params;
    const body = req.body as any;

    const result = await downtimeEventService.resolveDowntimeEvent({
        id: Number(id),
        end_time: String(body.end_time),
        resolution: body.resolution,
    }, user.id);

    return result;
});
