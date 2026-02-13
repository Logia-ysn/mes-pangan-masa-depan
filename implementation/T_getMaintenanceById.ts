
import { T_getMaintenanceById } from "../types/api/T_getMaintenanceById";
import { requireAuth } from "../utility/auth";
import { maintenanceRepository } from "../src/repositories/maintenance.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getMaintenanceById: T_getMaintenanceById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const maintenance = await maintenanceRepository.findById(req.path.id);
  if (!maintenance) throw new Error('Maintenance not found');
  return maintenance;
});
