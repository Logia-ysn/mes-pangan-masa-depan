import { T_createAttendance } from "../types/api/T_createAttendance";
import { attendanceRepository } from "../src/repositories/attendance.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_createAttendance: T_createAttendance = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'SUPERVISOR');
    const { id_employee, attendance_date, check_in_time, check_out_time, status, notes } = req.body;

    const data: any = {
        id_employee: Number(id_employee),
        id_user: user.id,
        attendance_date: new Date(attendance_date),
        status: status || 'PRESENT',
        notes: notes || null,
    };

    if (check_in_time) {
        data.check_in_time = new Date(`1970-01-01T${check_in_time}`);
    }
    if (check_out_time) {
        data.check_out_time = new Date(`1970-01-01T${check_out_time}`);
    }

    const created = await attendanceRepository.create(data);
    return created as any;
});
