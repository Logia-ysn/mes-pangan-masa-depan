import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { reportApi, factoryApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface Factory {
    id: number;
    code: string;
    name: string;
}

interface CustomerSales {
    customer_name: string;
    total: number;
}

interface SalesSummary {
    total_invoices: number;
    total_revenue: number;
    total_paid: number;
    total_outstanding: number;
    by_customer: CustomerSales[];
}

const PIE_COLORS = ['#2E7D32', '#1565C0', '#EF6C00', '#AD1457', '#6A1B9A', '#00838F', '#FF8F00', '#4E342E'];

const formatCurrency = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

const SalesReport = () => {
    const { theme } = useTheme();

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [factories, setFactories] = useState<Factory[]>([]);
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const chartColors = {
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
        text: theme === 'dark' ? '#92adc9' : '#64748b',
    };

    useEffect(() => {
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchSalesSummary();
    }, []);

    const fetchFactories = async () => {
        try {
            const response = await factoryApi.getAll({ limit: 100 });
            const data = response.data?.data || response.data || [];
            setFactories(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching factories:', error);
        }
    };

    const fetchSalesSummary = async () => {
        setLoading(true);
        try {
            const params: { id_factory?: number; start_date: string; end_date: string } = {
                start_date: startDate,
                end_date: endDate,
            };
            if (selectedFactory) {
                params.id_factory = Number(selectedFactory);
            }
            const response = await reportApi.getSalesSummary(params);
            setSummary(response.data?.data || response.data || null);
        } catch (error) {
            logger.error('Error fetching sales summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchSalesSummary();
    };

    const handleCSVExport = () => {
        if (!summary?.by_customer?.length) return;
        const data = summary.by_customer.map((item) => ({
            'Nama Customer': item.customer_name,
            'Total Penjualan': item.total,
        }));
        exportToCSV(data, `laporan-penjualan-${startDate}-${endDate}`);
    };

    const handleExcelExport = async () => {
        try {
            const response = await reportApi.downloadSalesExcel({
                id_factory: selectedFactory ? Number(selectedFactory) : undefined,
                start_date: startDate,
                end_date: endDate,
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-penjualan-${startDate}-${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
        }
    };

    const kpiCards = [
        {
            title: 'Total Invoice',
            value: summary?.total_invoices ?? 0,
            icon: 'receipt_long',
            format: 'number' as const,
        },
        {
            title: 'Total Revenue',
            value: summary?.total_revenue ?? 0,
            icon: 'payments',
            format: 'currency' as const,
        },
        {
            title: 'Total Paid',
            value: summary?.total_paid ?? 0,
            icon: 'check_circle',
            format: 'currency' as const,
        },
        {
            title: 'Outstanding',
            value: summary?.total_outstanding ?? 0,
            icon: 'pending',
            format: 'currency' as const,
        },
    ];

    const pieData = summary?.by_customer?.map((item) => ({
        name: item.customer_name,
        value: item.total,
    })) || [];

    return (
        <div className="page-container">
            <div className="page-content">
                {/* Filter Bar */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-body">
                        <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Tanggal Mulai</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Tanggal Akhir</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Pabrik</label>
                                <select
                                    className="form-input"
                                    value={selectedFactory}
                                    onChange={(e) => setSelectedFactory(e.target.value)}
                                >
                                    <option value="">Semua Pabrik</option>
                                    {factories.map((factory) => (
                                        <option key={factory.id} value={factory.id}>
                                            {factory.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">search</span>
                                {loading ? 'Memuat...' : 'Cari'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {kpiCards.map((kpi) => (
                        <div className="card" key={kpi.title}>
                            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="stat-icon" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>
                                    <span className="material-symbols-outlined">{kpi.icon}</span>
                                </div>
                                <div>
                                    <div className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {kpi.title}
                                    </div>
                                    <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                                        {kpi.format === 'currency'
                                            ? formatCurrency(kpi.value)
                                            : new Intl.NumberFormat('id-ID').format(kpi.value)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart and Table */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Pie Chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Revenue by Customer</h3>
                        </div>
                        <div className="card-body">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={110}
                                            dataKey="value"
                                            label={({ name, percent }: any) =>
                                                `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                                            }
                                        >
                                            {pieData.map((_entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: chartColors.tooltipBg,
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            }}
                                            formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>
                                        pie_chart
                                    </span>
                                    Tidak ada data untuk ditampilkan
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="card-title">Detail per Customer</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-ghost btn-sm" onClick={handleCSVExport} disabled={!summary?.by_customer?.length}>
                                    <span className="material-symbols-outlined icon-sm">download</span>
                                    CSV
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={handleExcelExport} disabled={!summary?.by_customer?.length}>
                                    <span className="material-symbols-outlined icon-sm">table_view</span>
                                    Excel
                                </button>
                            </div>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Nama Customer</th>
                                            <th style={{ textAlign: 'right' }}>Total Penjualan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary?.by_customer?.length ? (
                                            summary.by_customer.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.customer_name}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                    Tidak ada data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
