import { EntitySchema } from 'typeorm';

export interface WorkOrder {
    id: number;
    id_factory: number;
    work_order_number: string;
    title: string;
    description?: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    id_production_line?: number;
    planned_start?: Date;
    planned_end?: Date;
    actual_start?: Date;
    actual_end?: Date;
    target_quantity?: number;
    actual_quantity?: number;
    id_user: number;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export const WorkOrderEntity = new EntitySchema<WorkOrder>({
    name: 'WorkOrder',
    tableName: 'WorkOrder',
    columns: {
        id: { type: 'int', primary: true, generated: 'increment' },
        id_factory: { type: 'int' },
        work_order_number: { type: 'varchar', length: 50, unique: true },
        title: { type: 'varchar', length: 200 },
        description: { type: 'text', nullable: true },
        status: { type: 'enum', enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PLANNED' },
        priority: { type: 'enum', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
        id_production_line: { type: 'int', nullable: true },
        planned_start: { type: 'timestamp', nullable: true },
        planned_end: { type: 'timestamp', nullable: true },
        actual_start: { type: 'timestamp', nullable: true },
        actual_end: { type: 'timestamp', nullable: true },
        target_quantity: { type: 'decimal', precision: 15, scale: 2, nullable: true },
        actual_quantity: { type: 'decimal', precision: 15, scale: 2, nullable: true },
        id_user: { type: 'int' },
        notes: { type: 'text', nullable: true },
        created_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
        updated_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }
    }
});
