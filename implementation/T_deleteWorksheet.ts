/**
 * Delete Worksheet Handler (Presentation Layer)
 */

import { T_deleteWorksheet } from "../types/api/T_deleteWorksheet";
import { worksheetService } from "../src/services/worksheet.service";

export const t_deleteWorksheet: T_deleteWorksheet = async (req, res) => {
  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Call service
  await worksheetService.deleteWorksheet(id);

  // 3. Return response (MessageResponse requires both success and message)
  return { success: true, message: 'Worksheet deleted successfully' };
}
