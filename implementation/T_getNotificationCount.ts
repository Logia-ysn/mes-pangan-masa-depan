import { T_getNotificationCount } from "../types/api/T_getNotificationCount";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { notificationService } from "../src/services/notification.service";

export const t_getNotificationCount: T_getNotificationCount = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  const count = await notificationService.getUnreadCount(user.id);
  return { count };
});
