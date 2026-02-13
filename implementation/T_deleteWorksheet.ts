/**
 * Delete Worksheet Handler (Presentation Layer)
 */

import { T_deleteWorksheet } from "../types/api/T_deleteWorksheet";
import { worksheetService } from "../src/services/worksheet.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteWorksheet: T_deleteWorksheet = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'ADMIN');

  // 1. Extract ID from path
  const id = Number(req.path.id);

  // 2. Call service with user ID for stock reversal tracking
  await worksheetService.deleteWorksheet(id, user.id);

  // 3. Return response (MessageResponse requires both success and message)
  return { success: true, message: 'Worksheet deleted successfully' };
});
