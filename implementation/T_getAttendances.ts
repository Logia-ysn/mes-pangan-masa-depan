import { T_getAttendances } from "../types/api/T_getAttendances";
import { attendanceRepository } from "../src/repositories/attendance.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getAttendances: T_getAttendances = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { limit, offset, id_employee, id_factory, status, start_date, end_date } = req.query;

    const { data, total } = await attendanceRepository.findWithFilters({
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
        id_employee: id_employee ? Number(id_employee) : undefined,
        id_factory: id_factory ? Number(id_factory) : undefined,
        status: status as string,
        start_date: start_date as string,
        end_date: end_date as string
    });

    return { data: data as any, total };
});
