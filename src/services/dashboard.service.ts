/**
 * Dashboard Service
 * Handles dashboard statistics and reporting business logic using Prisma
 */

import { worksheetRepository } from '../repositories/worksheet.repository';
import { stockRepository } from '../repositories/stock.repository';
import { factoryRepository } from '../repositories/factory.repository';
import { prisma } from '../libs/prisma';
import { StockMovement_movement_type_enum } from '@prisma/client';

export interface DashboardStats {
    totalProduction: number;
    totalYield: number;
    avgRendemen: number;
    worksheetCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalEmployees: number;
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
            totalEmployees: await prisma.employee.count(),
            stockSummary
        };
    }

    /**
     * Get Executive Dashboard Data
     */
    async getExecutiveDashboard(factoryId?: number): Promise<ExecutiveDashboardData> {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

        // Fetch all required data in parallel
        const [
            productionStats,
            yesterdayStats,
            trendData,
            machineData,
            stockData,
            maintenanceData,
            dailyTarget,
            downtimeData
        ] = await Promise.all([
            this.getProductionStats(factoryId, startOfToday),
            this.getProductionStats(factoryId, startOfYesterday, startOfToday),
            this.getProductionTrend(factoryId, 7),
            this.getMachineSummary(factoryId),
            this.getInventorySnapshot(factoryId),
            this.getMaintenanceData(),
            this.calculateDailyTarget(factoryId),
            this.getDowntimeFromWorksheets(factoryId, startOfToday)
        ]);

        // Calculate OEE from real data
        const oeeScore = this.calculateOEE(machineData);
        const oeeStatus = oeeScore >= 85 ? 'good' : oeeScore >= 60 ? 'warning' : 'critical';

        // Calculate production trends
        const prodToday = productionStats.total_output;
        const prodYesterday = yesterdayStats.total_output;
        const prodChange = prodYesterday > 0 ? ((prodToday - prodYesterday) / prodYesterday) * 100 : 0;
        const prodTrend = prodChange > 5 ? 'up' : prodChange < -5 ? 'down' : 'stable';

        // Stock status calculation
        const gabahStock = stockData.stocks
            .filter(s => {
                const name = (s.name || '').toLowerCase();
                return name.includes('gabah') || name.includes('gkp') || name.includes('gkg');
            })
            .reduce((sum, s) => sum + s.quantity, 0);

        const berasStock = stockData.stocks
            .filter(s => {
                const name = (s.name || '').toLowerCase();
                return name.includes('beras');
            })
            .reduce((sum, s) => sum + s.quantity, 0);

        const gabahStatus = this.getStockStatus(gabahStock, stockData.stocks);
        const berasStatus = this.getStockStatus(berasStock, stockData.stocks);

        return {
            kpis: {
                oee_score: oeeScore,
                oee_status: oeeStatus,
                production_today: prodToday,
                production_trend: prodTrend,
                production_change_percent: Math.round(prodChange * 10) / 10,
                rendemen_avg: productionStats.avg_rendemen,
                rendemen_trend: 'stable',
                downtime_hours: downtimeData.total_downtime,
                downtime_trend: 'stable',
                stock_gabah: gabahStock,
                stock_gabah_status: gabahStatus,
                stock_beras: berasStock,
                stock_beras_status: berasStatus,
                pending_maintenance: maintenanceData.upcoming.length + maintenanceData.overdue.length,
                maintenance_status: maintenanceData.overdue.length > 0 ? 'critical' : maintenanceData.upcoming.length > 3 ? 'warning' : 'good'
            },
            production: {
                trend_data: trendData,
                target_today: dailyTarget,
                actual_today: prodToday,
                target_percent: dailyTarget > 0 ? Math.min(100, Math.round((prodToday / dailyTarget) * 100)) : 0,
                schedule_today: await this.getScheduleToday(factoryId)
            },
            machines: machineData,
            inventory: stockData,
            maintenance: maintenanceData
        };
    }

    private async calculateDailyTarget(factoryId?: number): Promise<number> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const stats = await this.getProductionStats(factoryId, startDate, endDate);
        const avgDaily = stats.worksheet_count > 0 ? stats.total_output / Math.min(7, stats.worksheet_count) : 0;
        return avgDaily > 0 ? Math.round(avgDaily * 1.1) : 15000;
    }

    private async getDowntimeFromWorksheets(factoryId?: number, startDate?: Date): Promise<{ total_downtime: number; by_machine: { name: string; hours: number }[] }> {
        const where: any = {};
        if (factoryId) where.id_factory = factoryId;
        if (startDate) where.worksheet_date = { gte: startDate };

        const worksheets = await prisma.worksheet.findMany({
            where,
            orderBy: { worksheet_date: 'desc' },
            take: 100
        });

        const totalDowntime = worksheets.reduce((sum, ws) => sum + Number(ws.downtime_hours || 0), 0);

        return {
            total_downtime: Math.round(totalDowntime * 10) / 10,
            by_machine: []
        };
    }

    private async getScheduleToday(factoryId?: number): Promise<ProductionOverview['schedule_today']> {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const where: any = {
            worksheet_date: {
                gte: startOfDay,
                lte: endOfDay
            }
        };
        if (factoryId) where.id_factory = factoryId;

        const worksheets = await prisma.worksheet.findMany({
            where,
            include: {
                Machine: true,
                ProductType: true
            }
        });

        return worksheets.map(ws => ({
            shift: ws.shift,
            machine: ws.Machine?.name || 'Unknown Machine',
            product: ws.ProductType?.name || 'Unknown Product'
        }));
    }

    private getStockStatus(quantity: number, allStocks: InventorySnapshot['stocks']): 'good' | 'warning' | 'critical' {
        if (allStocks.length === 0) return 'warning';
        const avgStock = allStocks.reduce((sum, s) => sum + s.quantity, 0) / allStocks.length;
        if (quantity >= avgStock * 0.7) return 'good';
        if (quantity >= avgStock * 0.3) return 'warning';
        return 'critical';
    }

    private calculateOEE(machineData: MachinesSummary): number {
        const { availability, performance, quality } = machineData.oee_breakdown;
        return Math.round((availability * performance * quality) / 10000);
    }

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

    private async getMachineSummary(factoryId?: number): Promise<MachinesSummary> {
        const whereClause: any = {};
        if (factoryId) whereClause.id_factory = factoryId;

        const machines = await prisma.machine.findMany({ where: whereClause });

        const total = machines.length;
        const active = machines.filter(m => m.status === 'ACTIVE').length;
        const maintenance = machines.filter(m => m.status === 'MAINTENANCE').length;
        const inactive = machines.filter(m => m.status === 'INACTIVE').length;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentWorksheets = await prisma.worksheet.findMany({
            where: {
                ...(factoryId ? { id_factory: factoryId } : {}),
                worksheet_date: { gte: weekAgo }
            }
        });

        const totalMachineHours = recentWorksheets.reduce((sum, ws) => sum + Number(ws.machine_hours || 0), 0);
        const totalDowntimeHours = recentWorksheets.reduce((sum, ws) => sum + Number(ws.downtime_hours || 0), 0);
        const totalGabahInput = recentWorksheets.reduce((sum, ws) => sum + Number(ws.gabah_input || 0), 0);
        const totalBerasOutput = recentWorksheets.reduce((sum, ws) => sum + Number(ws.beras_output || 0), 0);

        const avgCapacity = machines.reduce((sum, m) => sum + Number(m.capacity_per_hour || 0), 0) / (machines.length || 1);
        const expectedOutput = totalMachineHours * avgCapacity;

        const availability = (totalMachineHours + totalDowntimeHours) > 0
            ? Math.round((totalMachineHours / (totalMachineHours + totalDowntimeHours)) * 100)
            : (total > 0 ? Math.round((active / total) * 100) : 0);

        const performance = expectedOutput > 0 ? Math.min(100, Math.round((totalGabahInput / expectedOutput) * 100)) : 85;
        const quality = totalGabahInput > 0 ? Math.min(100, Math.round((totalBerasOutput / totalGabahInput) * 100 * 1.5)) : 90;

        const topDowntime = recentWorksheets
            .filter(ws => Number(ws.downtime_hours) > 0)
            .sort((a, b) => Number(b.downtime_hours) - Number(a.downtime_hours))
            .slice(0, 3)
            .map(ws => ({ name: `Shift ${ws.shift}`, hours: Number(ws.downtime_hours) }));

        return { total, active, maintenance, inactive, top_downtime: topDowntime, oee_breakdown: { availability, performance, quality } };
    }

    private async getInventorySnapshot(factoryId?: number): Promise<InventorySnapshot> {
        let stocks;
        if (factoryId) {
            stocks = await stockRepository.findByFactory(factoryId);
        } else {
            const result = await stockRepository.findWithFilters({ limit: 1000 });
            stocks = result.stocks;
        }

        const maxQuantity = stocks.reduce((max, s) => Math.max(max, Number(s.quantity)), 0);
        const avgQuantity = stocks.length > 0 ? stocks.reduce((sum, s) => sum + Number(s.quantity), 0) / stocks.length : 0;

        const stockItems = stocks.map(stock => {
            const quantity = Number(stock.quantity);
            const maxCapacity = Math.max(maxQuantity * 1.5, 50000);
            const percent = (quantity / maxCapacity) * 100;
            return {
                name: (stock as any).ProductType?.name || 'Unknown',
                quantity,
                max_capacity: maxCapacity,
                unit: stock.unit,
                status: percent > 50 ? 'good' : percent > 20 ? 'warning' : 'critical'
            };
        });

        const aggregated = new Map<string, typeof stockItems[0]>();
        stockItems.forEach(item => {
            const existing = aggregated.get(item.name);
            if (existing) existing.quantity += item.quantity;
            else aggregated.set(item.name, { ...item });
        });

        const minThreshold = Math.max(avgQuantity * 0.3, 5000);
        const stockAge = await this.calculateAvgStockAge();

        return {
            stocks: Array.from(aggregated.values()),
            low_stock_alerts: stockItems
                .filter(s => s.quantity < minThreshold)
                .map(s => ({ product: s.name, current: s.quantity, minimum: Math.round(minThreshold) })),
            avg_stock_age_days: stockAge
        };
    }

    private async calculateAvgStockAge(): Promise<number> {
        try {
            const today = new Date();
            const movements = await prisma.stockMovement.findMany({
                where: { movement_type: StockMovement_movement_type_enum.IN },
                orderBy: { created_at: 'desc' },
                take: 50
            });

            if (movements.length === 0) return 0;

            const totalDays = movements.reduce((sum, m) => {
                const daysDiff = Math.floor((today.getTime() - new Date(m.created_at).getTime()) / 86400000);
                return sum + daysDiff;
            }, 0);

            return Math.round(totalDays / movements.length);
        } catch {
            return 0;
        }
    }

    private async getMaintenanceData(): Promise<MaintenancePanel> {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const maintenances = await prisma.maintenance.findMany({
            include: { Machine: true },
            orderBy: { maintenance_date: 'desc' }
        });

        const upcoming: MaintenancePanel['upcoming'] = [];
        const overdue: MaintenancePanel['overdue'] = [];

        maintenances.forEach(m => {
            if (!m.next_maintenance_date) return;
            const scheduledDate = new Date(m.next_maintenance_date);
            const daysUntil = Math.ceil((scheduledDate.getTime() - today.getTime()) / 86400000);

            if (daysUntil < 0) {
                overdue.push({
                    machine: m.Machine?.name || 'Unknown',
                    due_date: scheduledDate.toISOString().split('T')[0],
                    type: m.maintenance_type,
                    days_overdue: Math.abs(daysUntil)
                });
            } else if (daysUntil <= 14) {
                upcoming.push({
                    machine: m.Machine?.name || 'Unknown',
                    due_date: scheduledDate.toISOString().split('T')[0],
                    type: m.maintenance_type,
                    days_until: daysUntil
                });
            }
        });

        const ticketsThisMonth = maintenances.filter(m => new Date(m.created_at || m.maintenance_date) >= startOfMonth).length;
        return { upcoming: upcoming.slice(0, 5), overdue: overdue.slice(0, 5), tickets_this_month: ticketsThisMonth };
    }

    async getProductionStats(factoryId?: number, startDate?: Date, endDate?: Date) {
        if (factoryId) {
            return await worksheetRepository.getProductionStats(factoryId, startDate, endDate);
        }
        const factories = await factoryRepository.findAll();
        const allStats = await Promise.all(factories.map(f => worksheetRepository.getProductionStats(f.id, startDate, endDate)));

        return allStats.reduce((acc, stats) => ({
            total_input: acc.total_input + stats.total_input,
            total_output: acc.total_output + stats.total_output,
            total_menir: acc.total_menir + stats.total_menir,
            total_dedak: acc.total_dedak + stats.total_dedak,
            total_sekam: acc.total_sekam + stats.total_sekam,
            avg_rendemen: acc.worksheet_count > 0 ? ((acc.avg_rendemen * acc.worksheet_count) + (stats.avg_rendemen * stats.worksheet_count)) / (acc.worksheet_count + stats.worksheet_count) : stats.avg_rendemen,
            worksheet_count: acc.worksheet_count + stats.worksheet_count
        }), { total_input: 0, total_output: 0, total_menir: 0, total_dedak: 0, total_sekam: 0, avg_rendemen: 0, worksheet_count: 0 });
    }

    private async getFinancialStats(factoryId?: number, startDate?: Date, endDate?: Date) {
        return { totalRevenue: 0, totalExpenses: 0 };
    }

    private async getStockSummary(factoryId?: number): Promise<StockSummary[]> {
        let stocks;
        if (factoryId) {
            stocks = await stockRepository.findByFactory(factoryId);
        } else {
            const result = await stockRepository.findWithFilters({ limit: 1000 });
            stocks = result.stocks;
        }

        return stocks.map(stock => ({
            productName: (stock as any).ProductType?.name || 'Unknown',
            productCode: (stock as any).ProductType?.code || 'N/A',
            quantity: Number(stock.quantity),
            unit: stock.unit
        }));
    }

    async getProductionSummary(params: DateRangeParams & { groupBy?: 'day' | 'week' | 'month' }) {
        const { worksheets } = await worksheetRepository.findWithFilters({
            id_factory: params.id_factory,
            start_date: params.start_date ? new Date(params.start_date) : undefined,
            end_date: params.end_date ? new Date(params.end_date) : undefined,
            limit: 1000
        });

        const groupedData = new Map<string, { date: string; total_input: number; total_output: number; count: number }>();

        worksheets.forEach(ws => {
            const wsDate = ws.worksheet_date instanceof Date ? ws.worksheet_date : new Date(ws.worksheet_date);
            const dateKey = wsDate.toISOString().split('T')[0];
            const existing = groupedData.get(dateKey) || { date: dateKey, total_input: 0, total_output: 0, count: 0 };
            existing.total_input += Number(ws.gabah_input);
            existing.total_output += Number(ws.beras_output);
            existing.count += 1;
            groupedData.set(dateKey, existing);
        });

        return Array.from(groupedData.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
}

export const dashboardService = new DashboardService();
