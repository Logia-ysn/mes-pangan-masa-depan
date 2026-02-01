import { T_getProductionSummary } from "../types/api/T_getProductionSummary";
import { Worksheet } from "../types/model/table/Worksheet";
import { getUserFromToken } from "../utility/auth";
import { Between } from "typeorm";

export const t_getProductionSummary: T_getProductionSummary = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { id_factory, start_date, end_date } = req.query;

  const where: any = { worksheet_date: Between(start_date, end_date) };
  if (id_factory) where.id_factory = id_factory;

  const worksheets = await Worksheet.find({ where });

  const total_gabah_input = worksheets.reduce((sum, w) => sum + Number(w.gabah_input), 0);
  const total_beras_output = worksheets.reduce((sum, w) => sum + Number(w.beras_output), 0);
  const total_menir_output = worksheets.reduce((sum, w) => sum + Number(w.menir_output), 0);
  const total_dedak_output = worksheets.reduce((sum, w) => sum + Number(w.dedak_output), 0);
  const total_sekam_output = worksheets.reduce((sum, w) => sum + Number(w.sekam_output), 0);
  const average_rendemen = total_gabah_input > 0 ? (total_beras_output / total_gabah_input) * 100 : 0;
  const total_machine_hours = worksheets.reduce((sum, w) => sum + Number(w.machine_hours), 0);
  const total_downtime_hours = worksheets.reduce((sum, w) => sum + Number(w.downtime_hours), 0);
  const oee = total_machine_hours > 0 ? ((total_machine_hours - total_downtime_hours) / total_machine_hours) * 100 : 0;

  return {
    total_gabah_input,
    total_beras_output,
    total_menir_output,
    total_dedak_output,
    total_sekam_output,
    average_rendemen,
    total_machine_hours,
    total_downtime_hours,
    oee
  };
}
