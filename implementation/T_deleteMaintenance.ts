import { T_deleteMaintenance } from "../types/api/T_deleteMaintenance";
import { Maintenance } from "../types/model/table/Maintenance";
import { getUserFromToken } from "../utility/auth";

export const t_deleteMaintenance: T_deleteMaintenance = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const maintenance = await Maintenance.findOne({ where: { id: req.path.id } });
  if (!maintenance) throw new Error('Maintenance not found');
  await maintenance.remove();
  return { message: 'Maintenance deleted successfully', success: true };
}
