/**
 * Change Password Handler (Presentation Layer)
 */

import { T_changePassword } from "../types/api/T_changePassword";
import { authService } from "../src/services/auth.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_changePassword: T_changePassword = apiWrapper(async (req, res) => {
  // 1. Authenticate user - OPERATOR (any logged-in user)
  const user = await requireAuth(req, 'OPERATOR');

  // 2. Extract from request (API uses old_password, not current_password)
  const { old_password, new_password } = req.body;

  // 3. Call service
  await authService.changePassword({
    userId: user.id,
    currentPassword: old_password,
    newPassword: new_password
  });

  // 4. Return success (MessageResponse requires both success and message)
  return { success: true, message: 'Password changed successfully' };
});
