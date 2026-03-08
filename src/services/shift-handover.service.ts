import { shiftHandoverRepo } from '../repositories/shift-handover.repository';
import { Prisma } from '@prisma/client';

export class ShiftHandoverService {
    async createLog(data: Prisma.ShiftHandoverUncheckedCreateInput, userId: number) {
        return shiftHandoverRepo.create({ ...data, outgoing_user_id: userId, status: 'SUBMITTED', submitted_at: new Date() });
    }

    async acknowledgeLog(id: number, incomingUserId: number) {
        const log = await shiftHandoverRepo.findById(id);
        if (!log) throw new Error('Handover log not found');
        if (log.status === 'ACKNOWLEDGED') throw new Error('Handover already acknowledged');

        return shiftHandoverRepo.update(id, {
            incoming_user_id: incomingUserId,
            status: 'ACKNOWLEDGED',
            acknowledged_at: new Date()
        });
    }

    async getLogs(params: any) {
        const where: Prisma.ShiftHandoverWhereInput = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.status) where.status = params.status;
        if (params.shift) where.shift = params.shift;

        return shiftHandoverRepo.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
    }
}
export const shiftHandoverService = new ShiftHandoverService();
