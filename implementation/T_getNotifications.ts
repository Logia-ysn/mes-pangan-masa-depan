import { T_getNotifications } from "../types/api/T_getNotifications";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { notificationService } from "../src/services/notification.service";

export const t_getNotifications: T_getNotifications = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  const { limit, offset } = req.query;

  const result = await notificationService.getNotifications(
    user.id,
    limit ? Number(limit) : 50,
    offset ? Number(offset) : 0
  );

  return result;
});
