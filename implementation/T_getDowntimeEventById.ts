import { T_getDowntimeEventById } from "../types/api/T_getDowntimeEventById";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_getDowntimeEventById: T_getDowntimeEventById = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const { id } = req.params;
    const result = await downtimeEventService.getDowntimeEventById(Number(id));

    return result;
});
