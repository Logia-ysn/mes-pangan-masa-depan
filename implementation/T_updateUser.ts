/**
 * Update User Handler (Presentation Layer)
 */

import { T_updateUser } from "../types/api/T_updateUser";
import { userService } from "../src/services/user.service";
import { requireAuth, sanitizeUser } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateUser: T_updateUser = apiWrapper(async (req, res) => {
  // 0. Auth check - ADMIN required
  await requireAuth(req, 'ADMIN');

  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);
  const { email, fullname, role, is_active } = req.body;

  // 2. Call service
  const user = await userService.updateUser({
    id,
    email,
    fullname,
    role,
    is_active
  });

  // 3. Return sanitized response
  return sanitizeUser(user);
});
