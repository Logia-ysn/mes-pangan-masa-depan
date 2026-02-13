import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '../../components/Layout/Header';
import { reportApi, factoryApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { useTheme } from '../../contexts/ThemeContext';

interface MovementByProduct {
    product_name: string;
    total_in: number;
    total_out: number;
}

interface StockReportData {
    total_in: number;
    total_out: number;
    movements_by_type: { movement_type: string; total_quantity: number; count: number }[];
    movements_by_product: MovementByProduct[];
}

interface Factory {
    id: number;
    name: string;
}

const StockReport = () => {
    const { theme } = useTheme();

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(formatDate(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(formatDate(today));
    const [selectedFactory, setSelectedFactory] = useState<number | ''>('');
    const [factories, setFactories] = useState<Factory[]>([]);
    const [data, setData] = useState<StockReportData | null>(null);
    const [loading, setLoading] = useState(false);

    const chartColors = {
        grid: theme === 'dark' ? '#233648' : '#e2e8f0',
        text: theme === 'dark' ? '#92adc9' : '#64748b',
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
    };

    const formatWeight = (num: number) =>
        new Intl.NumberFormat('id-ID').format(num) + ' kg';

    // Fetch factories on mount
    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const response = await factoryApi.getAll();
                setFactories(response.data?.data || response.data || []);
            } catch (err) {
                console.error('Failed to fetch factories:', err);
            }
        };
        fetchFactories();
    }, []);

    // Fetch report data
    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = {
                id_factory: selectedFactory || undefined,
                start_date: startDate,
                end_date: endDate,
            };
            const response = await reportApi.getStockReport(params);
            setData(response.data?.data || response.data);
        } catch (err) {
            console.error('Failed to fetch stock report:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchReport();
    }, []);

    const handleSearch = () => {
        fetchReport();
    };

    const handleCSVExport = () => {
        if (!data?.movements_by_product?.length) return;
        const rows = data.movements_by_product.map((item) => ({
            Produk: item.product_name,
            'Total Masuk (kg)': item.total_in,
            'Total Keluar (kg)': item.total_out,
            'Selisih (kg)': item.total_in - item.total_out,
        }));
        exportToCSV(rows, `laporan-stok-${startDate}-${endDate}`);
    };

    const handleExcelExport = async () => {
        try {
            const response = await reportApi.downloadStockExcel({
                id_factory: selectedFactory || undefined,
                start_date: startDate,
                end_date: endDate,
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-stok-${startDate}-${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
        }
    };

    const totalIn = data?.total_in ?? 0;
    const totalOut = data?.total_out ?? 0;
    const netChange = totalIn - totalOut;

    const chartData = (data?.movements_by_product || []).map((item) => ({
        product_name: item.product_name,
        Masuk: item.total_in,
        Keluar: item.total_out,
    }));

    return (
        <>
            <Header title="Laporan Stok" subtitle="Ringkasan pergerakan stok berdasarkan periode" />

            <div className="page-content">
                {/* Filter Bar */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">Filter Laporan</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', padding: '0 1.5rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tanggal Mulai</label>
                            <input
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tanggal Akhir</label>
                            <input
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pabrik</label>
                            <select
                                className="form-input"
                                value={selectedFactory}
                                onChange={(e) => setSelectedFactory(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">Semua Pabrik</option>
                                {factories.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={handleSearch}>
                            <span className="material-symbols-outlined icon-sm">search</span>
                            Cari
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#2E7D32', fontSize: '1.5rem' }}>arrow_downward</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Masuk (IN)</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {formatWeight(totalIn)}
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#EF6C00', fontSize: '1.5rem' }}>arrow_upward</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Keluar (OUT)</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {formatWeight(totalOut)}
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: netChange >= 0 ? '#2E7D32' : '#EF6C00', fontSize: '1.5rem' }}>swap_vert</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selisih (Net Change)</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: netChange >= 0 ? '#2E7D32' : '#EF6C00' }}>
                                    {netChange >= 0 ? '+' : ''}{formatWeight(netChange)}
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <h3 className="card-title">Pergerakan Stok per Produk</h3>
                            </div>
                            <div style={{ padding: '0 1.5rem 1.5rem', height: 350 }}>
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                            <XAxis
                                                dataKey="product_name"
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
                                                    boxShadow: 'var(--shadow-lg)',
                                                }}
                                                itemStyle={{ color: 'var(--text-primary)' }}
                                                formatter={(value: number) => formatWeight(value)}
                                            />
                                            <Legend />
                                            <Bar dataKey="Masuk" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Keluar" fill="#EF6C00" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <p style={{ color: 'var(--text-muted)' }}>Tidak ada data untuk periode ini</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <h3 className="card-title">Detail Pergerakan Stok</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost" onClick={handleCSVExport}>
                                        <span className="material-symbols-outlined icon-sm">download</span>
                                        CSV
                                    </button>
                                    <button className="btn btn-primary" onClick={handleExcelExport}>
                                        <span className="material-symbols-outlined icon-sm">download</span>
                                        Excel
                                    </button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table" id="stock-report-table">
                                    <thead>
                                        <tr>
                                            <th>Produk</th>
                                            <th style={{ textAlign: 'right' }}>Total Masuk (IN)</th>
                                            <th style={{ textAlign: 'right' }}>Total Keluar (OUT)</th>
                                            <th style={{ textAlign: 'right' }}>Selisih</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.movements_by_product?.length ? (
                                            data.movements_by_product.map((item, idx) => {
                                                const net = item.total_in - item.total_out;
                                                return (
                                                    <tr key={idx}>
                                                        <td>{item.product_name}</td>
                                                        <td style={{ textAlign: 'right' }}>{formatWeight(item.total_in)}</td>
                                                        <td style={{ textAlign: 'right' }}>{formatWeight(item.total_out)}</td>
                                                        <td style={{ textAlign: 'right', color: net >= 0 ? '#2E7D32' : '#EF6C00', fontWeight: 600 }}>
                                                            {net >= 0 ? '+' : ''}{formatWeight(net)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                                    Tidak ada data untuk periode ini
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default StockReport;
