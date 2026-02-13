/**
 * Get Worksheets Handler (Presentation Layer)
 */

import { T_getWorksheets } from "../types/api/T_getWorksheets";
import { requireAuth } from "../utility/auth";
import { worksheetService } from "../src/services/worksheet.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getWorksheets: T_getWorksheets = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  // 1. Extract query params
  const {
    limit,
    offset,
    id_factory,
    start_date,
    end_date
  } = req.query;

  // 2. Call service
  const { worksheets, total } = await worksheetService.getWorksheets({
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    id_factory: id_factory ? Number(id_factory) : undefined,
    start_date: start_date as string,
    end_date: end_date as string
  });

  // 3. Return response
  return {
    data: worksheets,
    total,
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0
  };
});
