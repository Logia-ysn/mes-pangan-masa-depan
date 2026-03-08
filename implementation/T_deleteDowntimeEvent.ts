import { T_deleteDowntimeEvent } from "../types/api/T_deleteDowntimeEvent";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { downtimeEventService } from "../src/services/downtime-event.service";

export const t_deleteDowntimeEvent: T_deleteDowntimeEvent = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');

    const { id } = req.params;
    await downtimeEventService.deleteDowntimeEvent(Number(id), user.id);

    return { message: "Downtime event deleted successfully", success: true };
});
