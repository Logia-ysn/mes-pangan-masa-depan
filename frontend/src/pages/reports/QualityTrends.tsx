import React, { useState, useEffect } from 'react';
import { reportApi, factoryApi } from '../../services/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import {
    TrendingUp,
    Calendar,
    Factory,
    RefreshCw,
    BarChart2,
    Activity,
    Droplets
} from 'lucide-react';
import toast from 'react-hot-toast';
import LogoLoader from '../../components/UI/LogoLoader';

const QualityTrends: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [factories, setFactories] = useState<any[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const loadFactories = async () => {
            try {
                const res = await factoryApi.getAll();
                setFactories(res.data.data);
            } catch (error) {
                console.error('Failed to load factories:', error);
            }
        };
        loadFactories();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await reportApi.getQualityTrends({
                id_factory: selectedFactory ? Number(selectedFactory) : undefined,
                start_date: startDate,
                end_date: endDate
            });

            const rawData = res.data.data;
            const groupedData: Record<string, any> = {};

            rawData.forEach((item: any) => {
                const date = format(new Date(item.analysis_date), 'dd/MM');
                if (!groupedData[date]) {
                    groupedData[date] = {
                        date,
                        moisture: 0,
                        density: 0,
                        green: 0,
                        count: 0
                    };
                }
                groupedData[date].moisture += Number(item.moisture_value || 0);
                groupedData[date].density += Number(item.density_value || 0);
                groupedData[date].green += Number(item.green_percentage || 0);
                groupedData[date].count += 1;
            });

            const chartData = Object.values(groupedData).map((group: any) => ({
                ...group,
                moisture: Number((group.moisture / group.count).toFixed(2)),
                density: Number((group.density / group.count).toFixed(2)),
                green: Number((group.green / group.count).toFixed(2)),
            }));

            setData(chartData);
        } catch (error) {
            console.error('Failed to fetch quality trends:', error);
            toast.error('Gagal mengambil data tren kualitas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedFactory, startDate, endDate]);

    const avgMoisture = data.length > 0 ? (data.reduce((s, i) => s + i.moisture, 0) / data.length).toFixed(1) : '0';
    const avgDensity = data.length > 0 ? (data.reduce((s, i) => s + i.density, 0) / data.length).toFixed(1) : '0';
    const avgGreen = data.length > 0 ? (data.reduce((s, i) => s + i.green, 0) / data.length).toFixed(1) : '0';

    const tooltipStyle = {
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        background: 'var(--bg-card)',
        fontSize: '0.8125rem',
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp color="var(--primary)" size={32} />
                        Tren Kualitas (SPC)
                    </h1>
                    <p>Visualisasi parameter kualitas gabah dan beras dari waktu ke waktu.</p>
                </div>
                <div className="page-header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ marginRight: '8px' }} />
                        Segarkan Data
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card mb-6" style={{ padding: '24px' }}>
                <div className="grid grid-3" style={{ gap: '20px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Factory size={14} /> Pilih Pabrik
                        </label>
                        <select
                            className="form-input form-select"
                            value={selectedFactory}
                            onChange={(e) => setSelectedFactory(e.target.value)}
                        >
                            <option value="">Semua Pabrik</option>
                            {factories.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} /> Periode Mulai
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} /> Periode Akhir
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-3 mb-6" style={{ gap: '20px' }}>
                <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Rerata Kadar Air</span>
                        <Droplets style={{ color: '#3b82f6' }} size={20} />
                    </div>
                    <div className="stat-card-value">
                        {avgMoisture}
                        <span style={{ fontSize: '1rem', marginLeft: '4px', opacity: 0.6 }}>%</span>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Rerata Densitas</span>
                        <BarChart2 style={{ color: '#10b981' }} size={20} />
                    </div>
                    <div className="stat-card-value">
                        {avgDensity}
                        <span style={{ fontSize: '1rem', marginLeft: '4px', opacity: 0.6 }}>g/L</span>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="stat-card-header">
                        <span className="stat-card-label">Rerata Butir Hijau</span>
                        <Activity style={{ color: '#f59e0b' }} size={20} />
                    </div>
                    <div className="stat-card-value">
                        {avgGreen}
                        <span style={{ fontSize: '1rem', marginLeft: '4px', opacity: 0.6 }}>%</span>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && data.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <LogoLoader small text="Memuat data kualitas..." />
                </div>
            )}

            {/* Charts */}
            {!loading && data.length === 0 ? (
                <div className="card" style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <h3 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>Belum Ada Data Kualitas</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                        Tidak ditemukan data analisis kualitas untuk periode yang dipilih. Coba ubah filter tanggal atau pabrik.
                    </p>
                </div>
            ) : data.length > 0 && (
                <>
                    {/* Moisture & Density Charts - Side by Side */}
                    <div className="grid grid-2 mb-6" style={{ gap: '24px' }}>
                        {/* Moisture Chart */}
                        <div className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Droplets size={18} color="#3b82f6" />
                                    Tren Kadar Air
                                </h3>
                                <span className="badge badge-info">%</span>
                            </div>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area
                                            type="monotone"
                                            dataKey="moisture"
                                            name="Kadar Air (%)"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorMoisture)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Density Chart */}
                        <div className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BarChart2 size={18} color="#10b981" />
                                    Tren Densitas
                                </h3>
                                <span className="badge badge-success">g/L</span>
                            </div>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Line
                                            type="monotone"
                                            dataKey="density"
                                            name="Densitas (g/L)"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Green Distribution - Full Width */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={18} color="#f59e0b" />
                                Distribusi Persentase Butir Hijau
                            </h3>
                            <span className="badge badge-warning">SPC Parameter</span>
                        </div>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                        contentStyle={tooltipStyle}
                                    />
                                    <Bar dataKey="green" name="Biji Hijau (%)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default QualityTrends;
