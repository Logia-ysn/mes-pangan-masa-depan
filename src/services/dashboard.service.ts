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
import { Invoice } from '../../types/model/table/Invoice';
import { DailyExpense } from '../../types/model/table/DailyExpense';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

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
        // Build where clause for invoices
        const invoiceWhere: any = {};
        if (factoryId) {
            invoiceWhere.id_factory = factoryId;
        }
        if (startDate && endDate) {
            invoiceWhere.invoice_date = Between(startDate, endDate);
        } else if (startDate) {
            invoiceWhere.invoice_date = MoreThanOrEqual(startDate);
        } else if (endDate) {
            invoiceWhere.invoice_date = LessThanOrEqual(endDate);
        }

        // Get invoices
        const invoices = await Invoice.find({ where: invoiceWhere });
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

        // Build where clause for expenses
        const expenseWhere: any = {};
        if (factoryId) {
            expenseWhere.id_factory = factoryId;
        }
        if (startDate && endDate) {
            expenseWhere.expense_date = Between(startDate, endDate);
        } else if (startDate) {
            expenseWhere.expense_date = MoreThanOrEqual(startDate);
        } else if (endDate) {
            expenseWhere.expense_date = LessThanOrEqual(endDate);
        }

        // Get expenses
        const expenses = await DailyExpense.find({ where: expenseWhere });
        const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        return { totalRevenue, totalExpenses };
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
            const dateKey = ws.worksheet_date.toISOString().split('T')[0];
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
