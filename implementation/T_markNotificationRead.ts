import { T_markNotificationRead } from "../types/api/T_markNotificationRead";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { notificationService } from "../src/services/notification.service";

export const t_markNotificationRead: T_markNotificationRead = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  const id = Number(req.path.id);
  const notification = await notificationService.markAsRead(id, user.id);
  return notification;
});
