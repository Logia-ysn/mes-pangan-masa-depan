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
import { sanitizeUser } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { ForbiddenError } from "../src/utils/errors";

export const t_register: T_register = apiWrapper(async (req, res) => {
  // 0. Disable public registration in production
  if (process.env.NODE_ENV === 'production') {
    throw new ForbiddenError('Public registration is disabled in production. Please contact administrator.');
  }

  // 1. Extract from request
  const { email, password, fullname } = req.body;

  // 2. Call service
  const result = await authService.register({ email, password, fullname });

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
