/**
 * Get Executive Dashboard Handler (Presentation Layer)
 * 
 * Returns comprehensive executive dashboard data for manufacturing KPIs
 */

import { T_getExecutiveDashboard } from "../types/api/T_getExecutiveDashboard";
import { dashboardService } from "../src/services/dashboard.service";

export const t_getExecutiveDashboard: T_getExecutiveDashboard = async (req, res) => {
    // 1. Extract query params
    const { id_factory } = req.query;

    // 2. Get executive dashboard data from service
    const data = await dashboardService.getExecutiveDashboard(
        id_factory ? Number(id_factory) : undefined
    );

    // 3. Return response
    return data;
};
