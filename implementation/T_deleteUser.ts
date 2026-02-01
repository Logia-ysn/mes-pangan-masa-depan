/**
 * Delete User Handler (Presentation Layer)
 */

import { T_deleteUser } from "../types/api/T_deleteUser";
import { userService } from "../src/services/user.service";

export const t_deleteUser: T_deleteUser = async (req, res) => {
  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Call service
  await userService.deleteUser(id);

  // 3. Return response (MessageResponse requires both success and message)
  return { success: true, message: 'User deleted successfully' };
}
