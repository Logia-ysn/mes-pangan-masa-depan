/**
 * Update Worksheet Handler (Presentation Layer)
 */

import { T_updateWorksheet } from "../types/api/T_updateWorksheet";
import { worksheetService } from "../src/services/worksheet.service";
import { Worksheet_shift_enum } from "@prisma/client";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateWorksheet: T_updateWorksheet = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

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
    shift: shift as Worksheet_shift_enum,
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
    side_products: side_products?.map((sp: any) => ({
      ...sp,
      is_auto_calculated: sp.is_auto_calculated ?? false,
      total_value: sp.total_value ?? (sp.quantity * sp.unit_price)
    }))
  });

  // 4. Return response
  return worksheet;
});
