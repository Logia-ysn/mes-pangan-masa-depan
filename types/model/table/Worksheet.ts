/**
 * Legacy TypeORM Worksheet type stub
 * @deprecated This project uses Prisma. See src/modules/production/worksheet/worksheet.types.ts for actual types.
 * This stub exists only to satisfy legacy auto-generated type references in types/api/*.ts
 */
export class Worksheet {
    id!: number;
    id_factory!: number;
    worksheet_date!: string;
    shift!: string;
    gabah_input!: number;
    beras_output!: number;
    menir_output?: number;
    dedak_output?: number;
    sekam_output?: number;
    machine_hours?: number;
    downtime_hours?: number;
    downtime_reason?: string;
    notes?: string;
    status?: string;
    created_at!: Date;
}
