/**
 * Get Users Handler (Presentation Layer)
 */

import { T_getUsers } from "../types/api/T_getUsers";
import { userService } from "../src/services/user.service";

export const t_getUsers: T_getUsers = async (req, res) => {
  // 1. Extract query params (only use what's defined in the API type)
  const { limit, offset, search, role } = req.query;

  // 2. Call service
  const { users, total } = await userService.getUsers({
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    search: search as string,
    role: role as string
  });

  // 3. Return response
  return {
    data: users,
    total,
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0
  };
}
