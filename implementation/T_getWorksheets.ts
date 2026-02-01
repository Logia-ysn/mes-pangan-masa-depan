/**
 * Get Worksheets Handler (Presentation Layer)
 */

import { T_getWorksheets } from "../types/api/T_getWorksheets";
import { worksheetService } from "../src/services/worksheet.service";

export const t_getWorksheets: T_getWorksheets = async (req, res) => {
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
}
