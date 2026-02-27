import { T_createDryingLog } from "../types/api/T_createDryingLog";
import { dryingLogService } from "../src/services/drying-log.service";

export const t_createDryingLog: T_createDryingLog = async (req, res) => {
  const {
    id_factory, batch_code, drying_date, method,
    initial_weight, final_weight, initial_moisture, final_moisture,
    downtime_hours, notes
  } = req.body;
  const user = (res as any).locals.user;

  try {
    const dryingLog = await dryingLogService.create({
      id_factory: Number(id_factory),
      id_user: user.id,
      batch_code,
      drying_date,
      method,
      initial_weight: Number(initial_weight),
      final_weight: Number(final_weight),
      initial_moisture: initial_moisture ? Number(initial_moisture) : undefined,
      final_moisture: final_moisture ? Number(final_moisture) : undefined,
      downtime_hours: downtime_hours ? Number(downtime_hours) : undefined,
      notes
    });

    return dryingLog as any;
  } catch (error: any) {
    if (error.name === 'BusinessRuleError') {
      throw error;
    }
    console.error("Error creating drying log:", error);
    throw new Error("Internal server error");
  }
};
