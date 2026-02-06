/**
 * Dashboard Service
 * Handles dashboard statistics and reporting business logic
 * 
 * RULES:
 * - No HTTP request/response objects
 * - No direct database queries (use repositories)
 * - Pure business logic only
 */

import { worksheetRepository } from '../repositories/worksheet.repository';
import { stockRepository } from '../repositories/stock.repository';
import { factoryRepository } from '../repositories/factory.repository';
import { AppDataSource } from '../../data-source';
import { Machine } from '../../types/model/table/Machine';
import { Maintenance } from '../../types/model/table/Maintenance';
import { Between, MoreThanOrEqual, LessThanOrEqual, LessThan, MoreThan } from 'typeorm';

export interface DashboardStats {
    totalProduction: number;
    totalYield: number;
    avgRendemen: number;
    worksheetCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    stockSummary: StockSummary[];
}

export interface StockSummary {
    productName: string;
    productCode: string;
    quantity: number;
    unit: string;
}

export interface DateRangeParams {
    id_factory?: number;
    start_date?: string;
    end_date?: string;
}

// Executive Dashboard Interfaces
export interface ExecutiveKPIs {
    oee_score: number;
    oee_status: 'good' | 'warning' | 'critical';
    production_today: number;
    production_trend: 'up' | 'down' | 'stable';
    production_change_percent: number;
    rendemen_avg: number;
    rendemen_trend: 'up' | 'down' | 'stable';
    downtime_hours: number;
    downtime_trend: 'up' | 'down' | 'stable';
    stock_gabah: number;
    stock_gabah_status: 'good' | 'warning' | 'critical';
    stock_beras: number;
    stock_beras_status: 'good' | 'warning' | 'critical';
    pending_maintenance: number;
    maintenance_status: 'good' | 'warning' | 'critical';
}

export interface ProductionOverview {
    trend_data: { date: string; gabah: number; beras: number; rendemen: number }[];
    target_today: number;
    actual_today: number;
    target_percent: number;
    schedule_today: { shift: string; machine: string; product: string }[];
}

export interface MachinesSummary {
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    top_downtime: { name: string; hours: number }[];
    oee_breakdown: {
        availability: number;
        performance: number;
        quality: number;
    };
}

export interface InventorySnapshot {
    stocks: { name: string; quantity: number; max_capacity: number; unit: string; status: string }[];
    low_stock_alerts: { product: string; current: number; minimum: number }[];
    avg_stock_age_days: number;
}

export interface MaintenancePanel {
    upcoming: { machine: string; due_date: string; type: string; days_until: number }[];
    overdue: { machine: string; due_date: string; type: string; days_overdue: number }[];
    tickets_this_month: number;
}

export interface ExecutiveDashboardData {
    kpis: ExecutiveKPIs;
    production: ProductionOverview;
    machines: MachinesSummary;
    inventory: InventorySnapshot;
    maintenance: MaintenancePanel;
}

class DashboardService {
    /**
     * Get comprehensive dashboard statistics
     */
    async getDashboardStats(params: DateRangeParams): Promise<DashboardStats> {
        const startDate = params.start_date ? new Date(params.start_date) : undefined;
        const endDate = params.end_date ? new Date(params.end_date) : undefined;

        // Get production stats
        const productionStats = await this.getProductionStats(params.id_factory, startDate, endDate);

        // Get financial stats
        const financialStats = await this.getFinancialStats(params.id_factory, startDate, endDate);

        // Get stock summary
        const stockSummary = await this.getStockSummary(params.id_factory);

        return {
            totalProduction: productionStats.total_input,
            totalYield: productionStats.total_output,
            avgRendemen: productionStats.avg_rendemen,
            worksheetCount: productionStats.worksheet_count,
            totalRevenue: financialStats.totalRevenue,
            totalExpenses: financialStats.totalExpenses,
            netProfit: financialStats.totalRevenue - financialStats.totalExpenses,
            stockSummary
        };
    }

    /**
     * Get Executive Dashboard Data (New)
     */
    async getExecutiveDashboard(factoryId?: number): Promise<ExecutiveDashboardData> {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - 7);

        // Fetch all required data in parallel
        const [
            productionStats,
            yesterdayStats,
            trendData,
            machineData,
            stockData,
            maintenanceData
        ] = await Promise.all([
            this.getProductionStats(factoryId, startOfToday),
            this.getProductionStats(factoryId, new Date(startOfToday.getTime() - 86400000), startOfToday),
            this.getProductionTrend(factoryId, 7),
            this.getMachineSummary(),
            this.getInventorySnapshot(factoryId),
            this.getMaintenanceData()
        ]);

        // Calculate OEE
        const oeeScore = this.calculateOEE(machineData);
        const oeeStatus = oeeScore >= 85 ? 'good' : oeeScore >= 60 ? 'warning' : 'critical';

        // Calculate production trends
        const prodToday = productionStats.total_output;
        const prodYesterday = yesterdayStats.total_output;
        const prodChange = prodYesterday > 0 ? ((prodToday - prodYesterday) / prodYesterday) * 100 : 0;
        const prodTrend = prodChange > 5 ? 'up' : prodChange < -5 ? 'down' : 'stable';

        // Target (mock - can be configurable)
        const dailyTarget = 15000; // 15 ton target per day

        return {
            kpis: {
                oee_score: oeeScore,
                oee_status: oeeStatus,
                production_today: prodToday,
                production_trend: prodTrend,
                production_change_percent: Math.round(prodChange * 10) / 10,
                rendemen_avg: productionStats.avg_rendemen,
                rendemen_trend: 'stable',
                downtime_hours: machineData.total - machineData.active > 0 ? (machineData.total - machineData.active) * 8 : 0,
                downtime_trend: 'stable',
                stock_gabah: stockData.stocks.find(s => s.name.includes('Gabah') || s.name.includes('GKP'))?.quantity || 0,
                stock_gabah_status: 'good',
                stock_beras: stockData.stocks.filter(s => s.name.includes('Beras')).reduce((sum, s) => sum + s.quantity, 0),
                stock_beras_status: 'good',
                pending_maintenance: maintenanceData.upcoming.length + maintenanceData.overdue.length,
                maintenance_status: maintenanceData.overdue.length > 0 ? 'critical' : maintenanceData.upcoming.length > 3 ? 'warning' : 'good'
            },
            production: {
                trend_data: trendData,
                target_today: dailyTarget,
                actual_today: prodToday,
                target_percent: Math.min(100, Math.round((prodToday / dailyTarget) * 100)),
                schedule_today: [] // Would need worksheet schedule data
            },
            machines: machineData,
            inventory: stockData,
            maintenance: maintenanceData
        };
    }

    /**
     * Calculate OEE from machine data
     */
    private calculateOEE(machineData: MachinesSummary): number {
        const { availability, performance, quality } = machineData.oee_breakdown;
        return Math.round((availability * performance * quality) / 10000);
    }

    /**
     * Get production trend for last N days
     */
    private async getProductionTrend(factoryId: number | undefined, days: number) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const { worksheets } = await worksheetRepository.findWithFilters({
            id_factory: factoryId,
            start_date: startDate,
            end_date: endDate,
            limit: 1000
        });

        // Group by date
        const grouped = new Map<string, { gabah: number; beras: number; count: number }>();

        worksheets.forEach(ws => {
            const wsDate = ws.worksheet_date instanceof Date ? ws.worksheet_date : new Date(ws.worksheet_date);
            const dateKey = wsDate.toISOString().split('T')[0];
            const existing = grouped.get(dateKey) || { gabah: 0, beras: 0, count: 0 };
            existing.gabah += Number(ws.gabah_input || 0);
            existing.beras += Number(ws.beras_output || 0);
            existing.count += 1;
            grouped.set(dateKey, existing);
        });

        return Array.from(grouped.entries())
            .map(([date, data]) => ({
                date,
                gabah: data.gabah,
                beras: data.beras,
                rendemen: data.gabah > 0 ? Math.round((data.beras / data.gabah) * 1000) / 10 : 0
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get machine summary with OEE breakdown
     */
    private async getMachineSummary(): Promise<MachinesSummary> {
        const machineRepo = AppDataSource.getRepository(Machine);
        const machines = await machineRepo.find();

        const total = machines.length;
        const active = machines.filter(m => m.status === 'ACTIVE').length;
        const maintenance = machines.filter(m => m.status === 'MAINTENANCE').length;
        const inactive = machines.filter(m => m.status === 'INACTIVE').length;

        // Calculate OEE breakdown (simplified)
        const availability = total > 0 ? Math.round((active / total) * 100) : 0;
        const performance = 88; // Mock - would need actual performance data
        const quality = 95; // Mock - would need quality rejection data

        // Top downtime machines (mock for now)
        const downMachines = machines
            .filter(m => m.status !== 'ACTIVE')
            .slice(0, 3)
            .map(m => ({ name: m.name, hours: Math.random() * 10 + 2 }));

        return {
            total,
            active,
            maintenance,
            inactive,
            top_downtime: downMachines,
            oee_breakdown: { availability, performance, quality }
        };
    }

    /**
     * Get inventory snapshot
     */
    private async getInventorySnapshot(factoryId?: number): Promise<InventorySnapshot> {
        let stocks;
        if (factoryId) {
            stocks = await stockRepository.findByFactory(factoryId);
        } else {
            const result = await stockRepository.findWithFilters({ limit: 100 });
            stocks = result.stocks;
        }

        const stockItems = stocks.map(stock => {
            const quantity = Number(stock.quantity);
            const maxCapacity = 100000; // Mock max capacity
            const percent = (quantity / maxCapacity) * 100;
            return {
                name: stock.otm_id_product_type?.name || 'Unknown',
                quantity,
                max_capacity: maxCapacity,
                unit: stock.unit,
                status: percent > 70 ? 'good' : percent > 30 ? 'warning' : 'critical'
            };
        });

        // Group by product type and aggregate
        const aggregated = new Map<string, typeof stockItems[0]>();
        stockItems.forEach(item => {
            const existing = aggregated.get(item.name);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                aggregated.set(item.name, { ...item });
            }
        });

        return {
            stocks: Array.from(aggregated.values()),
            low_stock_alerts: stockItems.filter(s => s.status === 'critical').map(s => ({
                product: s.name,
                current: s.quantity,
                minimum: 10000 // Mock minimum threshold
            })),
            avg_stock_age_days: 14 // Mock - would need batch date tracking
        };
    }

    /**
     * Get maintenance data
     */
    private async getMaintenanceData(): Promise<MaintenancePanel> {
        const maintenanceRepo = AppDataSource.getRepository(Maintenance);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get all maintenance records
        const maintenances = await maintenanceRepo.find({
            relations: ['otm_id_machine'],
            order: { maintenance_date: 'DESC' }
        });

        const upcoming: MaintenancePanel['upcoming'] = [];
        const overdue: MaintenancePanel['overdue'] = [];

        maintenances.forEach(m => {
            // Use next_maintenance_date if available, otherwise skip for upcoming/overdue
            const nextDate = m.next_maintenance_date;
            if (!nextDate) return;

            const scheduledDate = new Date(nextDate);
            const daysUntil = Math.ceil((scheduledDate.getTime() - today.getTime()) / 86400000);

            if (daysUntil < 0) {
                overdue.push({
                    machine: m.otm_id_machine?.name || 'Unknown',
                    due_date: scheduledDate.toISOString().split('T')[0],
                    type: m.maintenance_type,
                    days_overdue: Math.abs(daysUntil)
                });
            } else if (daysUntil <= 14) {
                upcoming.push({
                    machine: m.otm_id_machine?.name || 'Unknown',
                    due_date: scheduledDate.toISOString().split('T')[0],
                    type: m.maintenance_type,
                    days_until: daysUntil
                });
            }
        });

        // Count tickets this month
        const ticketsThisMonth = maintenances.filter(m => {
            const date = new Date(m.created_at || m.maintenance_date);
            return date >= startOfMonth;
        }).length;

        return {
            upcoming: upcoming.slice(0, 5),
            overdue: overdue.slice(0, 5),
            tickets_this_month: ticketsThisMonth
        };
    }


    /**
     * Get production statistics
     */
    async getProductionStats(factoryId?: number, startDate?: Date, endDate?: Date) {
        if (factoryId) {
            return await worksheetRepository.getProductionStats(factoryId, startDate, endDate);
        }

        // Aggregate across all factories
        const factories = await factoryRepository.findAll();
        const allStats = await Promise.all(
            factories.map(f => worksheetRepository.getProductionStats(f.id, startDate, endDate))
        );

        return allStats.reduce((acc, stats) => ({
            total_input: acc.total_input + stats.total_input,
            total_output: acc.total_output + stats.total_output,
            total_menir: acc.total_menir + stats.total_menir,
            total_dedak: acc.total_dedak + stats.total_dedak,
            total_sekam: acc.total_sekam + stats.total_sekam,
            avg_rendemen: acc.worksheet_count > 0
                ? ((acc.avg_rendemen * acc.worksheet_count) + (stats.avg_rendemen * stats.worksheet_count)) /
                (acc.worksheet_count + stats.worksheet_count)
                : stats.avg_rendemen,
            worksheet_count: acc.worksheet_count + stats.worksheet_count
        }), {
            total_input: 0,
            total_output: 0,
            total_menir: 0,
            total_dedak: 0,
            total_sekam: 0,
            avg_rendemen: 0,
            worksheet_count: 0
        });
    }

    /**
     * Get financial statistics
     */
    private async getFinancialStats(factoryId?: number, startDate?: Date, endDate?: Date) {
        return { totalRevenue: 0, totalExpenses: 0 };
    }

    /**
     * Get stock summary
     */
    private async getStockSummary(factoryId?: number): Promise<StockSummary[]> {
        let stocks;
        if (factoryId) {
            stocks = await stockRepository.findByFactory(factoryId);
        } else {
            const result = await stockRepository.findWithFilters({ limit: 100 });
            stocks = result.stocks;
        }

        return stocks.map(stock => ({
            productName: stock.otm_id_product_type?.name || 'Unknown',
            productCode: stock.otm_id_product_type?.code || 'N/A',
            quantity: Number(stock.quantity),
            unit: stock.unit
        }));
    }

    /**
     * Get production summary by period
     */
    async getProductionSummary(params: DateRangeParams & { groupBy?: 'day' | 'week' | 'month' }) {
        const { worksheets } = await worksheetRepository.findWithFilters({
            id_factory: params.id_factory,
            start_date: params.start_date ? new Date(params.start_date) : undefined,
            end_date: params.end_date ? new Date(params.end_date) : undefined,
            limit: 1000
        });

        // Group by date
        const groupedData = new Map<string, {
            date: string;
            total_input: number;
            total_output: number;
            count: number;
        }>();

        worksheets.forEach(ws => {
            // Handle both Date object and string from database
            const wsDate = ws.worksheet_date instanceof Date
                ? ws.worksheet_date
                : new Date(ws.worksheet_date);
            const dateKey = wsDate.toISOString().split('T')[0];
            const existing = groupedData.get(dateKey) || {
                date: dateKey,
                total_input: 0,
                total_output: 0,
                count: 0
            };

            existing.total_input += Number(ws.gabah_input);
            existing.total_output += Number(ws.beras_output);
            existing.count += 1;

            groupedData.set(dateKey, existing);
        });

        return Array.from(groupedData.values()).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }
}

// Singleton instance
export const dashboardService = new DashboardService();

