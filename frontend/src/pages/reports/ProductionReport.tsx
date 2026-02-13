import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';
import Header from '../../components/Layout/Header';
import { reportApi, factoryApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface Factory {
    id: number;
    code: string;
    name: string;
}

interface ProductionSummary {
    total_gabah_input: number;
    total_beras_output: number;
    total_menir_output: number;
    total_dedak_output: number;
    total_sekam_output: number;
    average_rendemen: number;
    total_machine_hours: number;
    total_downtime_hours: number;
    oee: number;
}

const formatNumber = (num: number): string =>
    new Intl.NumberFormat('id-ID').format(Number(num) || 0);

const formatPercent = (num: number): string =>
    `${(Number(num) || 0).toFixed(1)}%`;

const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
};

const ProductionReport = () => {
    const { theme } = useTheme();
    const defaultDates = getDefaultDates();

    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [factories, setFactories] = useState<Factory[]>([]);
    const [summary, setSummary] = useState<ProductionSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const chartColors = {
        grid: theme === 'dark' ? '#233648' : '#e2e8f0',
        text: theme === 'dark' ? '#92adc9' : '#64748b',
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
    };

    const barColors = {
        beras: '#3b82f6',
        menir: '#f59e0b',
        dedak: '#10b981',
        sekam: '#8b5cf6',
    };

    // Fetch factories on mount
    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const response = await factoryApi.getAll({ limit: 100 });
                const data = response.data?.data || response.data || [];
                setFactories(Array.isArray(data) ? data : []);
            } catch (error) {
                logger.error('Error fetching factories:', error);
            }
        };
        fetchFactories();
    }, []);

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        try {
            const params: { id_factory?: number; start_date: string; end_date: string } = {
                start_date: startDate,
                end_date: endDate,
            };
            if (selectedFactory) {
                params.id_factory = Number(selectedFactory);
            }
            const response = await reportApi.getProductionSummary(params);
            setSummary(response.data?.data || response.data || null);
        } catch (error) {
            logger.error('Error fetching production summary:', error);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCSVExport = () => {
        if (!summary) return;

        const csvData = [
            {
                'Periode': `${startDate} s/d ${endDate}`,
                'Total Gabah Input (kg)': summary.total_gabah_input,
                'Total Beras Output (kg)': summary.total_beras_output,
                'Total Menir Output (kg)': summary.total_menir_output,
                'Total Dedak Output (kg)': summary.total_dedak_output,
                'Total Sekam Output (kg)': summary.total_sekam_output,
                'Rata-rata Rendemen (%)': summary.average_rendemen,
                'Total Jam Mesin': summary.total_machine_hours,
                'Total Jam Downtime': summary.total_downtime_hours,
                'OEE (%)': summary.oee,
            },
        ];

        exportToCSV(csvData, `laporan-produksi-${startDate}-${endDate}`);
    };

    const handleExcelExport = async () => {
        try {
            const response = await reportApi.downloadProductionExcel({
                id_factory: selectedFactory ? Number(selectedFactory) : undefined,
                start_date: startDate,
                end_date: endDate,
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan-produksi-${startDate}-${endDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Error downloading Excel report:', err);
        }
    };

    const chartData = summary
        ? [
              { name: 'Beras', value: Number(summary.total_beras_output) || 0 },
              { name: 'Menir', value: Number(summary.total_menir_output) || 0 },
              { name: 'Dedak', value: Number(summary.total_dedak_output) || 0 },
              { name: 'Sekam', value: Number(summary.total_sekam_output) || 0 },
          ]
        : [];

    const kpiCards = summary
        ? [
              {
                  title: 'Total Gabah Input',
                  value: `${formatNumber(summary.total_gabah_input)} kg`,
                  icon: 'inventory_2',
                  color: '#3b82f6',
              },
              {
                  title: 'Beras Output',
                  value: `${formatNumber(summary.total_beras_output)} kg`,
                  icon: 'rice_bowl',
                  color: '#10b981',
              },
              {
                  title: 'Avg Rendemen',
                  value: formatPercent(summary.average_rendemen),
                  icon: 'percent',
                  color: '#f59e0b',
              },
              {
                  title: 'OEE',
                  value: formatPercent(summary.oee),
                  icon: 'speed',
                  color: '#8b5cf6',
              },
          ]
        : [];

    return (
        <div className="page-container">
            <Header title="Laporan Produksi" subtitle="Ringkasan produksi berdasarkan periode" />

            <div className="page-content">
                {/* Filter Bar */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-body">
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '1rem',
                                alignItems: 'flex-end',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Tanggal Mulai
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ minWidth: '160px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Tanggal Akhir
                                </label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ minWidth: '160px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                    Pabrik
                                </label>
                                <select
                                    className="form-input"
                                    value={selectedFactory}
                                    onChange={(e) => setSelectedFactory(e.target.value)}
                                    style={{ minWidth: '180px' }}
                                >
                                    <option value="">Semua Pabrik</option>
                                    {factories.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
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

                {/* Loading State */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>
                            progress_activity
                        </span>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Memuat data laporan...</p>
                    </div>
                )}

                {/* No Data State */}
                {!loading && hasSearched && !summary && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>
                            search_off
                        </span>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Tidak ada data produksi untuk periode yang dipilih.
                        </p>
                    </div>
                )}

                {/* Content - only show when we have data */}
                {!loading && summary && (
                    <>
                        {/* KPI Cards */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                            }}
                        >
                            {kpiCards.map((kpi) => (
                                <div className="card" key={kpi.title}>
                                    <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                backgroundColor: `${kpi.color}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <span
                                                className="material-symbols-outlined"
                                                style={{ color: kpi.color, fontSize: '1.5rem' }}
                                            >
                                                {kpi.icon}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                                {kpi.title}
                                            </p>
                                            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                                {kpi.value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <h3 className="card-title">Distribusi Output Produksi</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: chartColors.text, fontSize: 12 }}
                                                axisLine={{ stroke: chartColors.grid }}
                                                tickLine={{ stroke: chartColors.grid }}
                                            />
                                            <YAxis
                                                tick={{ fill: chartColors.text, fontSize: 12 }}
                                                axisLine={{ stroke: chartColors.grid }}
                                                tickLine={{ stroke: chartColors.grid }}
                                                tickFormatter={(val) => formatNumber(val)}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: chartColors.tooltipBg,
                                                    border: `1px solid ${chartColors.grid}`,
                                                    borderRadius: '8px',
                                                    color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
                                                }}
                                                formatter={(value: number) => [`${formatNumber(value)} kg`, 'Jumlah']}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="value"
                                                name="Output (kg)"
                                                radius={[6, 6, 0, 0]}
                                                fill={barColors.beras}
                                            >
                                                {chartData.map((entry, index) => {
                                                    const colors = [barColors.beras, barColors.menir, barColors.dedak, barColors.sekam];
                                                    return (
                                                        <rect key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                    );
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 className="card-title">Detail Ringkasan Produksi</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-ghost" onClick={handleCSVExport}>
                                        <span className="material-symbols-outlined icon-sm">download</span>
                                        CSV
                                    </button>
                                    <button className="btn btn-primary" onClick={handleExcelExport}>
                                        <span className="material-symbols-outlined icon-sm">table_view</span>
                                        Excel
                                    </button>
                                </div>
                            </div>
                            <div className="card-body" style={{ overflowX: 'auto' }}>
                                <table className="table" id="production-report-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th style={{ textAlign: 'right' }}>Nilai</th>
                                            <th>Satuan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Total Gabah Input</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_gabah_input)}
                                            </td>
                                            <td>kg</td>
                                        </tr>
                                        <tr>
                                            <td>Total Beras Output</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_beras_output)}
                                            </td>
                                            <td>kg</td>
                                        </tr>
                                        <tr>
                                            <td>Total Menir Output</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_menir_output)}
                                            </td>
                                            <td>kg</td>
                                        </tr>
                                        <tr>
                                            <td>Total Dedak Output</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_dedak_output)}
                                            </td>
                                            <td>kg</td>
                                        </tr>
                                        <tr>
                                            <td>Total Sekam Output</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_sekam_output)}
                                            </td>
                                            <td>kg</td>
                                        </tr>
                                        <tr>
                                            <td>Rata-rata Rendemen</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatPercent(summary.average_rendemen)}
                                            </td>
                                            <td>%</td>
                                        </tr>
                                        <tr>
                                            <td>Total Jam Mesin</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_machine_hours)}
                                            </td>
                                            <td>jam</td>
                                        </tr>
                                        <tr>
                                            <td>Total Jam Downtime</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatNumber(summary.total_downtime_hours)}
                                            </td>
                                            <td>jam</td>
                                        </tr>
                                        <tr>
                                            <td>OEE (Overall Equipment Effectiveness)</td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {formatPercent(summary.oee)}
                                            </td>
                                            <td>%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Initial prompt before search */}
                {!loading && !hasSearched && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}>
                            assessment
                        </span>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Pilih periode dan klik "Cari" untuk menampilkan laporan produksi.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductionReport;
