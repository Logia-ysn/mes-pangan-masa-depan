/**
 * Delete User Handler (Presentation Layer)
 */

import { T_deleteUser } from "../types/api/T_deleteUser";
import { userService } from "../src/services/user.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteUser: T_deleteUser = apiWrapper(async (req, res) => {
  // 0. Auth check - ADMIN required
  await requireAuth(req, 'ADMIN');

  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Call service
  await userService.deleteUser(id);

  // 3. Return response (MessageResponse requires both success and message)
  return { success: true, message: 'User deleted successfully' };
});
