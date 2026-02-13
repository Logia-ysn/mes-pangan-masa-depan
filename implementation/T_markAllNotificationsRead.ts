import { T_markAllNotificationsRead } from "../types/api/T_markAllNotificationsRead";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { notificationService } from "../src/services/notification.service";

export const t_markAllNotificationsRead: T_markAllNotificationsRead = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  const count = await notificationService.markAllAsRead(user.id);
  return { marked: count };
});
