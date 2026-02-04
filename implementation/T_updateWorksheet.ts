/**
 * Update Worksheet Handler (Presentation Layer)
 */

import { T_updateWorksheet } from "../types/api/T_updateWorksheet";
import { worksheetService } from "../src/services/worksheet.service";
import { WorkshiftType } from "../types/model/enum/WorkshiftType";

export const t_updateWorksheet: T_updateWorksheet = async (req, res) => {
  // 1. Extract ID from path (not params)
  const id = Number(req.path.id);

  // 2. Extract data from request body (only what's in API type)
  const body = req.body as any; // Type assertion for extended properties
  const {
    worksheet_date,
    shift,
    gabah_input,
    beras_output,
    menir_output,
    dedak_output,
    sekam_output,
    machine_hours,
    downtime_hours,
    downtime_reason,
    notes,
    id_machine,
    id_output_product,
    batch_code,
    production_cost,
    raw_material_cost,
    side_product_revenue,
    hpp,
    hpp_per_kg,
    side_products
  } = body;

  // 3. Call service
  const worksheet = await worksheetService.updateWorksheet({
    id,
    worksheet_date,
    shift: shift as WorkshiftType,
    gabah_input,
    beras_output,
    menir_output,
    dedak_output,
    sekam_output,
    machine_hours,
    downtime_hours,
    downtime_reason,
    notes,
    id_machine,
    id_output_product,
    batch_code,
    production_cost,
    raw_material_cost,
    side_product_revenue,
    hpp,
    hpp_per_kg,
    side_products: side_products?.map(sp => ({
      ...sp,
      is_auto_calculated: sp.is_auto_calculated ?? false,
      total_value: sp.total_value ?? (sp.quantity * sp.unit_price)
    }))
  });

  // 4. Return response
  return worksheet;
}
