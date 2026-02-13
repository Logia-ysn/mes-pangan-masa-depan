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
import { sanitizeUser } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_login: T_login = apiWrapper(async (req, res) => {
  // 1. Extract from request
  const { email, password } = req.body;

  // 2. Call service (all business logic is there)
  const result = await authService.login({ email, password });

  // 3. Set httpOnly cookie
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24h, matching JWT expiry
    path: '/',
  });

  // 4. Return response (token still included for backward compatibility)
  return {
    token: result.token,
    user: sanitizeUser(result.user)
  };
});
