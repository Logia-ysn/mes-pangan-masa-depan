/**
 * Register Handler (Presentation Layer)
 * 
 * Responsibilities:
 * - Parse request body
 * - Call service layer
 * - Return response
 */

import { T_register } from "../types/api/T_register";
import { authService } from "../src/services/auth.service";

export const t_register: T_register = async (req, res) => {
  // 1. Extract from request
  const { email, password, fullname } = req.body;

  // 2. Call service
  const result = await authService.register({ email, password, fullname });

  // 3. Return response
  return {
    token: result.token,
    user: result.user
  };
}
