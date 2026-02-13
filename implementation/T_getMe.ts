/**
 * Get Me Handler (Presentation Layer)
 * 
 * Returns current authenticated user
 */

import { T_getMe } from "../types/api/T_getMe";
import { requireAuth, sanitizeUser } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getMe: T_getMe = apiWrapper(async (req, res) => {
  // 1. Authenticate user
  const user = await requireAuth(req, 'OPERATOR');

  // 2. Return sanitized user
  return sanitizeUser(user);
});
