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
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900 with opacity
        backdropFilter: 'blur(12px)',
        color: '#f8fafc', // slate-50
        fontSize: '0.8rem',
        padding: '16px',
        borderLeft: '4px solid var(--primary)'
    };

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(19, 127, 236, 0.2)'
                    }}>
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Quality Trends (SPC)</h1>
                        <p className="page-subtitle">Visualisasi parameter kualitas gabah dan beras dari waktu ke waktu</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, var(--primary), #3b82f6)', border: 'none' }}
                >
                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Segarkan Data
                </button>
            </div>

            {/* Filters Bar */}
            <div className="glass-card" style={{ marginBottom: 24, padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    <div>
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2 flex items-center gap-2">
                            <Factory className="w-3.5 h-3.5" /> Pilih Pabrik
                        </label>
                        <select
                            className="form-control"
                            style={{ background: 'var(--bg-surface)', border: 'none' }}
                            value={selectedFactory}
                            onChange={(e) => setSelectedFactory(e.target.value)}
                        >
                            <option value="">Semua Pabrik</option>
                            {factories.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Periode Mulai
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            style={{ background: 'var(--bg-surface)', border: 'none' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Periode Akhir
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            style={{ background: 'var(--bg-surface)', border: 'none' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Rerata Kadar Air</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Droplets className="text-blue-500 w-4 h-4" />
                        </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        {avgMoisture}
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>%</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 2, marginTop: 12 }}>
                        <div style={{ width: `${Math.min(Number(avgMoisture) * 5, 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }}></div>
                    </div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Rerata Densitas</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BarChart2 className="text-emerald-500 w-4 h-4" />
                        </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        {avgDensity}
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>g/L</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 2, marginTop: 12 }}>
                        <div style={{ width: `${Math.min(Number(avgDensity) / 10, 100)}%`, height: '100%', background: '#10b981', borderRadius: 2 }}></div>
                    </div>
                </div>

                <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Rerata Butir Hijau</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Activity className="text-amber-500 w-4 h-4" />
                        </div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        {avgGreen}
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>%</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, marginTop: 12 }}>
                        <div style={{ width: `${Math.min(Number(avgGreen) * 10, 100)}%`, height: '100%', background: '#f59e0b', borderRadius: 2 }}></div>
                    </div>
                </div>
            </div>

            {loading && data.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center' }} className="glass-card">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">Analyzing Quality Matrix</span>
                </div>
            ) : data.length === 0 ? (
                <div style={{ padding: '80px 20px', textAlign: 'center' }} className="glass-card">
                    <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-20" />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Data Belum Tersedia</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '8px auto' }}>
                        Tidak ditemukan data analisis kualitas untuk periode yang dipilih. Silakan sesuaikan parameter pencarian.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
                        {/* Moisture Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 16, fontWeight: 700 }}>
                                    <Droplets className="w-5 h-5 text-blue-500" />
                                    Tren Kadar Air
                                </h3>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: 6 }}>PARAMETER (%)</span>
                            </div>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="moisture"
                                            name="Kadar Air"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorMoisture)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Density Chart */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 16, fontWeight: 700 }}>
                                    <BarChart2 className="w-5 h-5 text-emerald-500" />
                                    Tren Densitas
                                </h3>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 6 }}>UNIT (g/L)</span>
                            </div>
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(16, 185, 129, 0.2)', strokeWidth: 2 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="density"
                                            name="Densitas"
                                            stroke="#10b981"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: 'var(--bg-glass)' }}
                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Green Distribution - Full Width */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 16, fontWeight: 700 }}>
                                <Activity className="w-5 h-5 text-amber-500" />
                                Distribusi Persentase Butir Hijau
                            </h3>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, fontWeight: 700 }}>SPC ANALYTICS</button>
                        </div>
                        <div style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={tooltipStyle}
                                    />
                                    <Bar
                                        dataKey="green"
                                        name="Biji Hijau"
                                        fill="url(#colorGreen)"
                                        radius={[8, 8, 0, 0]}
                                        barSize={40}
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QualityTrends;
