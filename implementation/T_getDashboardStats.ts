
import { T_getDashboardStats } from "../types/api/T_getDashboardStats";
import { requireAuth } from "../utility/auth";
import { dashboardService } from "../src/services/dashboard.service";
import { employeeRepository } from "../src/repositories/employee.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getDashboardStats: T_getDashboardStats = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');
  // 1. Extract query params
  const { id_factory, start_date, end_date } = req.query;

  // 2. Get stats from service
  const stats = await dashboardService.getDashboardStats({
    id_factory: id_factory ? Number(id_factory) : undefined,
    start_date: start_date as string,
    end_date: end_date as string
  });

  // 3. Get production trend data
  const productionSummary = await dashboardService.getProductionSummary({
    id_factory: id_factory ? Number(id_factory) : undefined,
    start_date: start_date as string,
    end_date: end_date as string
  });

  // 4. Get employee count
  const totalEmployees = await employeeRepository.count();

  // 5. Return response in expected format
  return {
    total_gabah_input: stats.totalProduction,
    total_beras_output: stats.totalYield,
    average_rendemen: stats.avgRendemen,
    total_revenue: stats.totalRevenue,
    total_expenses: stats.totalExpenses,
    total_employees: totalEmployees,
    production_trend: productionSummary.map(item => ({
      date: item.date,
      gabah_input: item.total_input,
      beras_output: item.total_output
    }))
  };
});
