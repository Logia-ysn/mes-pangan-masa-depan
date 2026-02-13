import { T_getMaintenances } from "../types/api/T_getMaintenances";
import { maintenanceRepository } from "../src/repositories/maintenance.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getMaintenances: T_getMaintenances = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  const { limit, offset, id_machine, maintenance_type, start_date, end_date } = req.query;

  const { data, total } = await maintenanceRepository.findWithFilters({
    limit: limit ? Number(limit) : 10,
    offset: offset ? Number(offset) : 0,
    id_machine: id_machine ? Number(id_machine) : undefined,
    maintenance_type: maintenance_type as string,
    start_date: start_date ? new Date(start_date as string) : undefined,
    end_date: end_date ? new Date(end_date as string) : undefined
  });

  return { data: data as any, total };
});
