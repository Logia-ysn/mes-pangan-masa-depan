
import { T_deleteMaintenance } from "../types/api/T_deleteMaintenance";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { maintenanceRepository } from "../src/repositories/maintenance.repository";

export const t_deleteMaintenance: T_deleteMaintenance = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');
  const maintenance = await maintenanceRepository.findById(req.path.id);
  if (!maintenance) throw new Error('Maintenance not found');
  await maintenanceRepository.delete(req.path.id);
  return { message: 'Maintenance deleted successfully', success: true };
});
