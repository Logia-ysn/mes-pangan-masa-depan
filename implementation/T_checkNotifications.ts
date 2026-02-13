import { T_checkNotifications } from "../types/api/T_checkNotifications";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { notificationService } from "../src/services/notification.service";

export const t_checkNotifications: T_checkNotifications = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'OPERATOR');
  const result = await notificationService.checkAndCreateAlerts(user.id);
  return result;
});
