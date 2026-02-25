import { BaseRepository } from './base.repository';
import { Attendance } from '@prisma/client';

export class AttendanceRepository extends BaseRepository<Attendance> {
    protected modelName = 'Attendance';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_employee?: number;
        id_factory?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_employee) where.id_employee = params.id_employee;
        if (params.status) where.status = params.status;
        if (params.id_factory) {
            where.Employee = { id_factory: params.id_factory };
        }
        if (params.start_date || params.end_date) {
            where.attendance_date = {};
            if (params.start_date) where.attendance_date.gte = new Date(params.start_date);
            if (params.end_date) where.attendance_date.lte = new Date(params.end_date);
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                include: {
                    Employee: { select: { id: true, employee_code: true, fullname: true, position: true, department: true } },
                    User: { select: { id: true, fullname: true } }
                },
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: [{ attendance_date: 'desc' }, { created_at: 'desc' }]
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const attendanceRepository = new AttendanceRepository();
