import { T_getMaintenanceById } from "../types/api/T_getMaintenanceById";
import { Maintenance } from "../types/model/table/Maintenance";
import { getUserFromToken } from "../utility/auth";

export const t_getMaintenanceById: T_getMaintenanceById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const maintenance = await Maintenance.findOne({ where: { id: req.path.id } });
  if (!maintenance) throw new Error('Maintenance not found');
  return maintenance;
}
