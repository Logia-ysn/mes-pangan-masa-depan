import { T_createDryingLog } from "../types/api/T_createDryingLog";
import { prisma } from "../src/libs/prisma";

export const t_createDryingLog: T_createDryingLog = async (req, res) => {
  const { id_factory, batch_code, drying_date, method, initial_weight, final_weight, initial_moisture, final_moisture, downtime_hours, shrinkage_kg, shrinkage_pct, notes } = req.body;
  const user = (res as any).locals.user;

  try {
    const dryingLog = await prisma.dryingLog.create({
      data: {
        id_factory: Number(id_factory),
        id_user: user.id,
        batch_code,
        drying_date: new Date(drying_date),
        method,
        initial_weight: Number(initial_weight),
        final_weight: Number(final_weight),
        initial_moisture: initial_moisture ? Number(initial_moisture) : null,
        final_moisture: final_moisture ? Number(final_moisture) : null,
        downtime_hours: downtime_hours ? Number(downtime_hours) : null,
        shrinkage_kg: shrinkage_kg ? Number(shrinkage_kg) : null,
        shrinkage_pct: shrinkage_pct ? Number(shrinkage_pct) : null,
        notes
      }
    });

    return dryingLog as any;
  } catch (error: any) {
    console.error("Error creating drying log:", error);
    throw new Error("Internal server error");
  }
};
