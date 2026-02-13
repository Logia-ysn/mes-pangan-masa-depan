import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Header from '../../components/Layout/Header';
import { reportApi, factoryApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface BreakdownItem {
    category: string;
    amount: number;
}

interface COGMData {
    total_production_cost: number;
    total_beras_output: number;
    cost_per_kg: number;
    breakdown: BreakdownItem[];
}

interface Factory {
    id: number;
    name: string;
}

const PIE_COLORS = ['#2E7D32', '#1565C0', '#EF6C00', '#AD1457', '#6A1B9A'];

const formatCurrency = (num: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);

const formatWeight = (num: number) =>
    `${new Intl.NumberFormat('id-ID').format(num)} kg`;

const COGMReport = () => {
    const { theme } = useTheme();

    const chartColors = {
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
        text: theme === 'dark' ? '#92adc9' : '#64748b',
    };

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const toDateString = (d: Date) => d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(toDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(toDateString(today));
    const [selectedFactory, setSelectedFactory] = useState<number | undefined>(undefined);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [data, setData] = useState<COGMData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchReport();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchFactories = async () => {
        try {
            const response = await factoryApi.getAll({ limit: 100 });
            const list = response.data?.data || response.data || [];
            setFactories(Array.isArray(list) ? list : []);
        } catch (error) {
            logger.error('Error fetching factories:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: { id_factory?: number; start_date: string; end_date: string } = {
                start_date: startDate,
                end_date: endDate,
            };
            if (selectedFactory) {
                params.id_factory = selectedFactory;
            }
            const response = await reportApi.getCOGMReport(params);
            setData(response.data?.data || response.data || null);
        } catch (error) {
            logger.error('Error fetching COGM report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchReport();
    };

    const handleExportCSV = () => {
        if (!data?.breakdown || data.breakdown.length === 0) return;

        const csvData = data.breakdown.map((item) => ({
            Kategori: item.category,
            'Jumlah (Rp)': item.amount,
        }));

        csvData.push({
            Kategori: 'TOTAL',
            'Jumlah (Rp)': data.total_production_cost,
        });

        exportToCSV(csvData, `laporan-hpp-${startDate}-${endDate}`);
    };

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: {
        cx: number;
        cy: number;
        midAngle: number;
        innerRadius: number;
        outerRadius: number;
        percent: number;
    }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <>
            <Header
                title="Harga Pokok Produksi (HPP)"
                subtitle="Analisis biaya produksi per periode"
            />

            <div className="page-content">
                {/* Filter Bar */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <h3 className="card-title">Filter Laporan</h3>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1rem 1.5rem',
                            flexWrap: 'wrap',
                            alignItems: 'flex-end',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Pabrik
                            </label>
                            <select
                                className="form-input"
                                value={selectedFactory || ''}
                                onChange={(e) =>
                                    setSelectedFactory(
                                        e.target.value ? Number(e.target.value) : undefined
                                    )
                                }
                            >
                                <option value="">Semua Pabrik</option>
                                {factories.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={handleSearch}>
                            <span className="material-symbols-outlined icon-sm">search</span>
                            Cari
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">
                                hourglass_empty
                            </span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                )}

                {/* Content */}
                {!loading && data && (
                    <>
                        {/* KPI Cards */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '1.5rem',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            background: 'var(--primary-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ color: 'var(--primary)', fontSize: 24 }}
                                        >
                                            payments
                                        </span>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            Total Biaya Produksi
                                        </p>
                                        <h3
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {formatCurrency(data.total_production_cost)}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            background: 'var(--success-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ color: 'var(--success)', fontSize: 24 }}
                                        >
                                            grain
                                        </span>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            Total Output Beras
                                        </p>
                                        <h3
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {formatWeight(data.total_beras_output)}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            background: 'var(--warning-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span
                                            className="material-symbols-outlined"
                                            style={{ color: 'var(--warning)', fontSize: 24 }}
                                        >
                                            price_change
                                        </span>
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            HPP per Kg
                                        </p>
                                        <h3
                                            style={{
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {formatCurrency(data.cost_per_kg)}
                                            <span
                                                style={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: 400,
                                                    color: 'var(--text-muted)',
                                                }}
                                            >
                                                /kg
                                            </span>
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart + Table Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginBottom: '1.5rem',
                            }}
                        >
                            {/* Pie Chart */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Komposisi Biaya Produksi</h3>
                                </div>
                                <div style={{ height: 350, padding: '1rem' }}>
                                    {data.breakdown && data.breakdown.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={renderCustomLabel}
                                                    outerRadius={120}
                                                    dataKey="amount"
                                                    nameKey="category"
                                                >
                                                    {data.breakdown.map((_entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                PIE_COLORS[
                                                                    index % PIE_COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: chartColors.tooltipBg,
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: 8,
                                                        boxShadow: 'var(--shadow-lg)',
                                                    }}
                                                    itemStyle={{
                                                        color: 'var(--text-primary)',
                                                    }}
                                                    formatter={(value: number) =>
                                                        formatCurrency(value)
                                                    }
                                                />
                                                <Legend
                                                    wrapperStyle={{
                                                        color: chartColors.text,
                                                        fontSize: '0.8rem',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div
                                            className="empty-state"
                                            style={{ height: '100%' }}
                                        >
                                            <p style={{ color: 'var(--text-muted)' }}>
                                                Tidak ada data breakdown
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Rincian Biaya</h3>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={handleExportCSV}
                                        disabled={
                                            !data.breakdown || data.breakdown.length === 0
                                        }
                                    >
                                        <span className="material-symbols-outlined icon-sm">
                                            download
                                        </span>
                                        Export CSV
                                    </button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Kategori</th>
                                                <th style={{ textAlign: 'right' }}>
                                                    Jumlah (Rp)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.breakdown && data.breakdown.length > 0 ? (
                                                <>
                                                    {data.breakdown.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: 12,
                                                                            height: 12,
                                                                            borderRadius: 3,
                                                                            backgroundColor:
                                                                                PIE_COLORS[
                                                                                    index %
                                                                                        PIE_COLORS.length
                                                                                ],
                                                                        }}
                                                                    />
                                                                    {item.category}
                                                                </div>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    textAlign: 'right',
                                                                    fontVariantNumeric:
                                                                        'tabular-nums',
                                                                }}
                                                            >
                                                                {formatCurrency(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr
                                                        style={{
                                                            fontWeight: 700,
                                                            borderTop:
                                                                '2px solid var(--border-color)',
                                                        }}
                                                    >
                                                        <td>Total</td>
                                                        <td
                                                            style={{
                                                                textAlign: 'right',
                                                                fontVariantNumeric:
                                                                    'tabular-nums',
                                                            }}
                                                        >
                                                            {formatCurrency(
                                                                data.total_production_cost
                                                            )}
                                                        </td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={2}
                                                        style={{
                                                            textAlign: 'center',
                                                            color: 'var(--text-muted)',
                                                            padding: '2rem',
                                                        }}
                                                    >
                                                        Tidak ada data
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && !data && (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">assessment</span>
                        </div>
                        <h3>Belum Ada Data</h3>
                        <p>
                            Pilih periode dan klik "Cari" untuk menampilkan laporan HPP.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default COGMReport;
