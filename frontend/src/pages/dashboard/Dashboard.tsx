import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { dashboardApi } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import KPICard from '../../components/Dashboard/KPICard';
import MachinePanel from '../../components/Dashboard/MachinePanel';
import InventoryPanel from '../../components/Dashboard/InventoryPanel';
import MaintenancePanel from '../../components/Dashboard/MaintenancePanel';
import { logger } from '../../utils/logger';
import './Dashboard.css';

// Types for Executive Dashboard
interface ExecutiveKPIs {
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

interface ProductionOverview {
    trend_data: { date: string; gabah: number; beras: number; rendemen: number }[];
    target_today: number;
    actual_today: number;
    target_percent: number;
    schedule_today: { shift: string; machine: string; product: string }[];
}

interface MachinesSummary {
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

interface InventorySnapshot {
    stocks: { name: string; quantity: number; max_capacity: number; unit: string; status: string }[];
    low_stock_alerts: { product: string; current: number; minimum: number }[];
    avg_stock_age_days: number;
}

interface MaintenancePanelData {
    upcoming: { machine: string; due_date: string; type: string; days_until?: number }[];
    overdue: { machine: string; due_date: string; type: string; days_overdue?: number }[];
    tickets_this_month: number;
}

interface ExecutiveDashboardData {
    kpis: ExecutiveKPIs;
    production: ProductionOverview;
    machines: MachinesSummary;
    inventory: InventorySnapshot;
    maintenance: MaintenancePanelData;
}


import { useFactory } from '../../hooks/useFactory';

import LogoLoader from '../../components/UI/LogoLoader';

const Dashboard = () => {
    const [data, setData] = useState<ExecutiveDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7' | '30'>('7');
    const { theme } = useTheme();

    const {
        factories,
        selectedFactory,
        setSelectedFactory,
        loading: factoryLoading
    } = useFactory();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await dashboardApi.getExecutive(
                    selectedFactory ? { id_factory: selectedFactory } : undefined
                );
                setData(response.data);
            } catch (error) {
                logger.error('Error fetching executive dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        if (!factoryLoading) {
            fetchData();
        }
    }, [selectedFactory, factoryLoading]);

    const formatNumber = (num: number) =>
        new Intl.NumberFormat('id-ID').format(Number(num));

    const formatWeight = (kg: number) => {
        if (kg >= 1000) {
            return `${(kg / 1000).toFixed(1)} ton`;
        }
        return `${formatNumber(kg)} kg`;
    };

    // Chart colors based on theme
    const chartColors = {
        grid: theme === 'dark' ? '#233648' : '#e2e8f0',
        text: theme === 'dark' ? '#92adc9' : '#64748b',
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
    };

    // Prepare chart data - NO MOCK DATA, real data only
    const chartData = useMemo(() => {
        if (data?.production?.trend_data && data.production.trend_data.length > 0) {
            return data.production.trend_data.map(item => ({
                date: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                gabah: item.gabah,
                beras: item.beras,
            }));
        }
        // Return empty array - no mock data in production
        return [];
    }, [data]);

    if (loading) {
        return <LogoLoader text="Memuat Dashboard Eksekutif..." />;
    }

    const kpis = data?.kpis || {
        oee_score: 0,
        oee_status: 'warning' as const,
        production_today: 0,
        production_trend: 'stable' as const,
        production_change_percent: 0,
        rendemen_avg: 0,
        rendemen_trend: 'stable' as const,
        downtime_hours: 0,
        downtime_trend: 'stable' as const,
        stock_gabah: 0,
        stock_gabah_status: 'warning' as const,
        stock_beras: 0,
        stock_beras_status: 'warning' as const,
        pending_maintenance: 0,
        maintenance_status: 'good' as const,
    };

    const production = data?.production || {
        trend_data: [],
        target_today: 15000,
        actual_today: 0,
        target_percent: 0,
        schedule_today: [],
    };

    const machines = data?.machines || {
        total: 0,
        active: 0,
        maintenance: 0,
        inactive: 0,
        top_downtime: [],
        oee_breakdown: { availability: 0, performance: 0, quality: 0 },
    };

    const inventory = data?.inventory || {
        stocks: [],
        low_stock_alerts: [],
        avg_stock_age_days: 0,
    };

    const maintenance = data?.maintenance || {
        upcoming: [],
        overdue: [],
        tickets_this_month: 0,
    };

    const getOEEStatusLabel = (score: number) => {
        if (score >= 85) return 'World Class';
        if (score >= 60) return 'Good';
        return 'Perlu Perbaikan';
    };


    return (
        <div className="page-content">
            {/* Factory Toggle */}
            <div className="factory-selector-scroll">
                <button
                    className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedFactory(null)}
                >
                    <span className="material-symbols-outlined icon-sm">apps</span>
                    Semua
                </button>
                {factories.map(factory => (
                    <button
                        key={factory.id}
                        className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedFactory(factory.id)}
                    >
                        <span className="material-symbols-outlined icon-sm">factory</span>
                        {factory.name}
                    </button>
                ))}
            </div>
            {/* Page Header */}
            <div className="page-header page-header-responsive">
                <div className="page-header-content">
                    <h1>Executive Dashboard</h1>
                    <p>Real-time manufacturing insights and performance metrics</p>
                </div>
                <div className="page-header-actions">
                    <button
                        className={`btn ${dateRange === '7' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setDateRange('7')}
                    >
                        7 Hari
                    </button>
                    <button
                        className={`btn ${dateRange === '30' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setDateRange('30')}
                    >
                        30 Hari
                    </button>
                    <button className="btn btn-primary">
                        <span className="material-symbols-outlined icon-sm">download</span>
                        Export
                    </button>
                </div>
            </div>

            {/* Section 1: KPI Cards */}
            <div className="kpi-grid">
                <KPICard
                    label="OEE Score"
                    value={`${kpis.oee_score}%`}
                    icon="speed"
                    status={kpis.oee_status}
                    statusLabel={getOEEStatusLabel(kpis.oee_score)}
                    progress={kpis.oee_score}
                />
                <KPICard
                    label="Produksi Hari Ini"
                    value={formatWeight(kpis.production_today)}
                    icon="grain"
                    trend={kpis.production_trend}
                    trendValue={kpis.production_change_percent !== 0 ? `${kpis.production_change_percent > 0 ? '+' : ''}${kpis.production_change_percent}%` : ''}
                />
                <KPICard
                    label="Rendemen"
                    value={`${kpis.rendemen_avg.toFixed(1)}%`}
                    icon="percent"
                    trend={kpis.rendemen_trend}
                    status={kpis.rendemen_avg >= 60 ? 'good' : kpis.rendemen_avg >= 50 ? 'warning' : 'critical'}
                />
                <KPICard
                    label="Downtime Mesin"
                    value={`${kpis.downtime_hours.toFixed(1)}h`}
                    icon="timer_off"
                    trend={kpis.downtime_trend}
                    status={kpis.downtime_hours <= 2 ? 'good' : kpis.downtime_hours <= 8 ? 'warning' : 'critical'}
                />
                <KPICard
                    label="Stok Gabah"
                    value={formatWeight(kpis.stock_gabah)}
                    icon="warehouse"
                    status={kpis.stock_gabah_status}
                />
                <KPICard
                    label="Stok Beras"
                    value={formatWeight(kpis.stock_beras)}
                    icon="inventory_2"
                    status={kpis.stock_beras_status}
                />
                <KPICard
                    label="Pending Maintenance"
                    value={kpis.pending_maintenance}
                    icon="build"
                    status={kpis.maintenance_status}
                    statusLabel={kpis.pending_maintenance === 0 ? 'Semua OK' : `${kpis.pending_maintenance} tiket`}
                />
                <KPICard
                    label="Target Harian"
                    value={`${production.target_percent}%`}
                    icon="flag"
                    status={production.target_percent >= 80 ? 'good' : production.target_percent >= 50 ? 'warning' : 'critical'}
                    progress={production.target_percent}
                />
            </div>

            {/* Section 2 & 3: Production Overview + Machine Panel */}
            <div className="dashboard-grid">
                {/* Production Overview */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Ringkasan Produksi</h3>
                            <p className="card-subtitle">Output Gabah & Beras ({dateRange} Hari Terakhir)</p>
                        </div>
                        <Link to="/production/worksheets" className="btn btn-ghost btn-sm">
                            Lihat Detail
                            <span className="material-symbols-outlined icon-sm">arrow_forward</span>
                        </Link>
                    </div>

                    {/* Summary Stats */}
                    <div className="summary-stats">
                        <div className="summary-stat">
                            <span className="summary-stat-label">Total Gabah Input</span>
                            <span className="summary-stat-value">{formatWeight(chartData.reduce((sum, d) => sum + d.gabah, 0))}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="summary-stat-label">Total Beras Output</span>
                            <span className="summary-stat-value">{formatWeight(chartData.reduce((sum, d) => sum + d.beras, 0))}</span>
                        </div>
                        <div className="summary-stat">
                            <span className="summary-stat-label">Avg Rendemen</span>
                            <span className="summary-stat-value success">{kpis.rendemen_avg.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Target Progress */}
                    <div className="target-progress">
                        <div className="target-header">
                            <span className="target-label">Target Produksi Hari Ini</span>
                            <span className="target-percent">{production.target_percent}%</span>
                        </div>
                        <div className="target-bar">
                            <div
                                className="target-bar-fill"
                                style={{ width: `${Math.min(100, production.target_percent)}%` }}
                            />
                        </div>
                        <div className="target-values">
                            <span>{formatWeight(production.actual_today)}</span>
                            <span>Target: {formatWeight(production.target_today)}</span>
                        </div>
                    </div>

                    {/* Chart */}
                    <div style={{ height: 280, width: '100%', marginTop: 20 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGabah" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBeras" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: chartColors.text, fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: chartColors.text, fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: chartColors.tooltipBg,
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        boxShadow: 'var(--shadow-lg)'
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="gabah"
                                    stroke="var(--primary)"
                                    fillOpacity={1}
                                    fill="url(#colorGabah)"
                                    name="Gabah Input (kg)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="beras"
                                    stroke="var(--success)"
                                    fillOpacity={1}
                                    fill="url(#colorBeras)"
                                    name="Beras Output (kg)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Machine & OEE Panel */}
                <MachinePanel data={machines} />
            </div>

            {/* Section 4 & 5: Inventory + Maintenance */}
            <div className="dashboard-grid-half">
                <InventoryPanel data={inventory} />
                <MaintenancePanel data={maintenance} />
            </div>
        </div>
    );
};

export default Dashboard;
