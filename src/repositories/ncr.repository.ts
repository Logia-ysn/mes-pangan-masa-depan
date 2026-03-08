import { PrismaClient, NonConformanceReport, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class NonConformanceReportRepository {
    async create(data: Prisma.NonConformanceReportUncheckedCreateInput): Promise<NonConformanceReport> {
        return await prisma.nonConformanceReport.create({
            data,
        });
    }

    async update(id: number, data: Prisma.NonConformanceReportUncheckedUpdateInput): Promise<NonConformanceReport> {
        return await prisma.nonConformanceReport.update({
            where: { id },
            data,
        });
    }

    async findById(id: number): Promise<NonConformanceReport | null> {
        return await prisma.nonConformanceReport.findUnique({
            where: { id },
            include: {
                Factory: true,
                ReportedByUser: true,
                ResolvedByUser: true,
                Worksheet: true
            }
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.NonConformanceReportWhereInput;
        orderBy?: Prisma.NonConformanceReportOrderByWithRelationInput;
    }): Promise<{ data: NonConformanceReport[], total: number }> {
        const { skip, take, where, orderBy } = params;
        const [data, total] = await Promise.all([
            prisma.nonConformanceReport.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    Factory: true,
                    ReportedByUser: true,
                    ResolvedByUser: true
                }
            }),
            prisma.nonConformanceReport.count({ where }),
        ]);

        return { data, total };
    }

    async delete(id: number): Promise<NonConformanceReport> {
        return await prisma.nonConformanceReport.delete({
            where: { id },
        });
    }
}

export const ncrRepository = new NonConformanceReportRepository();
