/**
 * Create Worksheet Handler (Presentation Layer)
 * 
 * Responsibilities:
 * - Parse request body
 * - Get authenticated user
 * - Call service layer
 * - Return response
 * 
 * RULES:
 * - No business logic (moved to worksheetService)
 * - No database queries (moved to worksheetRepository)
 * - Keep it "skinny"
 */

import { T_createWorksheet } from "../types/api/T_createWorksheet";
import { authService } from "../src/services/auth.service";
import { worksheetService } from "../src/services/worksheet.service";
import { WorkshiftType } from "../types/model/enum/WorkshiftType";
import { apiWrapper } from "../src/utils/apiWrapper";
import { CreateWorksheetSchema } from "../src/dto/worksheet.dto";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ValidationError } from "../src/utils/errors";

export const t_createWorksheet: T_createWorksheet = apiWrapper(async (req, res) => {
  console.log('Creating worksheet:', req.body);

  // 1. Get authenticated user
  const user = await authService.getUserFromToken(req.headers.authorization!);

  // 2. Validate Request Body
  const body = req.body as any;
  const dto = plainToInstance(CreateWorksheetSchema, body);
  const errors = await validate(dto);

  if (errors.length > 0) {
    const constraints: Record<string, string[]> = {};
    errors.forEach(err => {
      constraints[err.property] = Object.values(err.constraints || {});
    });
    throw new ValidationError('Validation failed', constraints);
  }

  const {
    id_factory,
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
    input_batch_id,
    id_machine,
    input_category_code,
    process_step,
    production_cost,
    // New enhancement fields
    id_output_product,
    process_steps,
    batch_code,
    raw_material_cost,
    side_product_revenue,
    hpp,
    hpp_per_kg,
    input_batches,
    side_products
  } = body;

  // 3. Call service (all business logic is there)
  const worksheet = await worksheetService.createWorksheet({
    id_factory,
    id_user: user.id,
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
    input_batch_id,
    id_machine,
    input_category_code,
    process_step,
    production_cost,
    // New enhancement fields
    id_output_product,
    process_steps,
    batch_code,
    raw_material_cost,
    side_product_revenue,
    hpp,
    hpp_per_kg,
    input_batches,
    side_products
  });

  // 4. Return response
  return worksheet;
});
