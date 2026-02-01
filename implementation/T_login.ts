/**
 * Login Handler (Presentation Layer)
 * 
 * Responsibilities:
 * - Parse request body
 * - Call service layer
 * - Return response
 * 
 * RULES:
 * - No business logic (that's in authService)
 * - No database queries (that's in userRepository)
 * - Keep it "skinny"
 */

import { T_login } from "../types/api/T_login";
import { authService } from "../src/services/auth.service";

export const t_login: T_login = async (req, res) => {
  // 1. Extract from request
  const { email, password } = req.body;

  // 2. Call service (all business logic is there)
  const result = await authService.login({ email, password });

  // 3. Return response
  return {
    token: result.token,
    user: result.user
  };
}
