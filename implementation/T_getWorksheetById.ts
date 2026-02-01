/**
 * Get Worksheet By ID Handler (Presentation Layer)
 */

import { T_getWorksheetById } from "../types/api/T_getWorksheetById";
import { worksheetService } from "../src/services/worksheet.service";

export const t_getWorksheetById: T_getWorksheetById = async (req, res) => {
  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Call service
  const worksheet = await worksheetService.getWorksheetById(id);

  // 3. Return response
  return worksheet;
}
