/**
 * Get User By ID Handler (Presentation Layer)
 */

import { T_getUserById } from "../types/api/T_getUserById";
import { userService } from "../src/services/user.service";

export const t_getUserById: T_getUserById = async (req, res) => {
  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Call service
  const user = await userService.getUserById(id);

  // 3. Return response
  return user;
}
