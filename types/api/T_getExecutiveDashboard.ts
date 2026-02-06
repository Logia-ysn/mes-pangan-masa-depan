import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getExecutiveDashboard_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_getExecutiveDashboard_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
    id_factory?: number
}

// Return type classes
class KPIs {
    oee_score!: number;
    oee_status!: 'good' | 'warning' | 'critical';
    production_today!: number;
    production_trend!: 'up' | 'down' | 'stable';
    production_change_percent!: number;
    rendemen_avg!: number;
    rendemen_trend!: 'up' | 'down' | 'stable';
    downtime_hours!: number;
    downtime_trend!: 'up' | 'down' | 'stable';
    stock_gabah!: number;
    stock_gabah_status!: 'good' | 'warning' | 'critical';
    stock_beras!: number;
    stock_beras_status!: 'good' | 'warning' | 'critical';
    pending_maintenance!: number;
    maintenance_status!: 'good' | 'warning' | 'critical';
}

class TrendDataItem {
    date!: string;
    gabah!: number;
    beras!: number;
    rendemen!: number;
}

class ScheduleItem {
    shift!: string;
    machine!: string;
    product!: string;
}

class ProductionOverview {
    trend_data!: TrendDataItem[];
    target_today!: number;
    actual_today!: number;
    target_percent!: number;
    schedule_today!: ScheduleItem[];
}

class TopDowntimeItem {
    name!: string;
    hours!: number;
}

class OEEBreakdown {
    availability!: number;
    performance!: number;
    quality!: number;
}

class MachinesSummary {
    total!: number;
    active!: number;
    maintenance!: number;
    inactive!: number;
    top_downtime!: TopDowntimeItem[];
    oee_breakdown!: OEEBreakdown;
}

class StockItem {
    name!: string;
    quantity!: number;
    max_capacity!: number;
    unit!: string;
    status!: string;
}

class LowStockAlert {
    product!: string;
    current!: number;
    minimum!: number;
}

class InventorySnapshot {
    stocks!: StockItem[];
    low_stock_alerts!: LowStockAlert[];
    avg_stock_age_days!: number;
}

class MaintenanceItem {
    machine!: string;
    due_date!: string;
    type!: string;
    days_until?: number;
    days_overdue?: number;
}

class MaintenancePanel {
    upcoming!: MaintenanceItem[];
    overdue!: MaintenanceItem[];
    tickets_this_month!: number;
}

class ExecutiveDashboardResponse {
    kpis!: KPIs;
    production!: ProductionOverview;
    machines!: MachinesSummary;
    inventory!: InventorySnapshot;
    maintenance!: MaintenancePanel;
}

export type T_getExecutiveDashboard = (request: {
    headers: T_getExecutiveDashboard_headers
    query: T_getExecutiveDashboard_query
}, response: Response) => Promise<ExecutiveDashboardResponse>;

export const method = 'get';
export const url_path = '/dashboard/executive';
export const alias = 'T_getExecutiveDashboard';
export const is_streaming = false;
