/**
 * Get Me Handler (Presentation Layer)
 * 
 * Returns current authenticated user
 */

import { T_getMe } from "../types/api/T_getMe";
import { authService } from "../src/services/auth.service";

export const t_getMe: T_getMe = async (req, res) => {
  // 1. Get user from token (via service)
  const user = await authService.getUserFromToken(req.headers.authorization!);

  // 2. Return user
  return user;
}
