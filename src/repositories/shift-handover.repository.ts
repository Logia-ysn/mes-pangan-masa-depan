import { prisma } from '../libs/prisma';
import { ShiftHandover, Prisma } from '@prisma/client';

export class ShiftHandoverRepository {
    async create(data: Prisma.ShiftHandoverUncheckedCreateInput) {
        return prisma.shiftHandover.create({ data });
    }

    async findMany(params: {
        where?: Prisma.ShiftHandoverWhereInput;
        orderBy?: Prisma.ShiftHandoverOrderByWithRelationInput;
        skip?: number;
        take?: number;
    }) {
        return prisma.shiftHandover.findMany({
            ...params,
            include: {
                OutgoingUser: { select: { fullname: true, email: true } },
                IncomingUser: { select: { fullname: true, email: true } },
                Factory: { select: { name: true } }
            }
        });
    }

    async findById(id: number) {
        return prisma.shiftHandover.findUnique({
            where: { id },
            include: {
                OutgoingUser: { select: { fullname: true, email: true } },
                IncomingUser: { select: { fullname: true, email: true } }
            }
        });
    }

    async update(id: number, data: Prisma.ShiftHandoverUncheckedUpdateInput) {
        return prisma.shiftHandover.update({ where: { id }, data });
    }
}
export const shiftHandoverRepo = new ShiftHandoverRepository();
