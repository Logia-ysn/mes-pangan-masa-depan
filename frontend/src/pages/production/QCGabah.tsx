import React, { useState, useEffect } from 'react';
import { qcGabahApi, reportApi, factoryApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { Activity, Droplets, BarChart2, Calendar, Factory, TrendingUp } from 'lucide-react';
import LogoLoader from '../../components/UI/LogoLoader';

interface AnalysisResult {
    green_percentage: number;
    yellow_percentage: number;
    damaged_percentage?: number;
    rotten_percentage?: number;
    defect_percentage?: number;
    red_percentage?: number;
    chalky_percentage?: number;
    normal_percentage?: number;
    grade: string;
    status: string;
    level: number;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'KW 1': { bg: 'rgba(34, 197, 94, 0.1)', text: '#166534', border: '#22c55e' },
    'KW 2': { bg: 'rgba(234, 179, 8, 0.1)', text: '#854d0e', border: '#eab308' },
    'KW 3': { bg: 'rgba(239, 68, 68, 0.1)', text: '#991b1b', border: '#ef4444' },
    'REJECT': { bg: 'rgba(127, 29, 29, 0.15)', text: '#7f1d1d', border: '#dc2626' },
};

const COLOR_BAR_ITEMS = [
    { key: 'yellow_percentage', label: 'Kuning (Baik)', color: '#eab308' },
    { key: 'green_percentage', label: 'Hijau (Mentah)', color: '#22c55e' },
    { key: 'damaged_percentage', label: 'Rusak', color: '#a16207' },
    { key: 'rotten_percentage', label: 'Busuk', color: '#1c1917' },
    { key: 'red_percentage', label: 'Merah', color: '#ef4444' },
    { key: 'chalky_percentage', label: 'Kapur', color: '#d1d5db' },
    { key: 'normal_percentage', label: 'Lainnya', color: '#94a3b8' },
] as const;

const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    background: 'var(--bg-card)',
    fontSize: '0.8125rem',
};

const QCGabah = () => {
    const { showError, showSuccess } = useToast();
    const [activeTab, setActiveTab] = useState<'trends' | 'analyze'>('trends');

    // ==========================================
    // TRENDS STATE
    // ==========================================
    const [factories, setFactories] = useState<any[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [trendData, setTrendData] = useState<any[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(false);

    useEffect(() => {
        const loadFactories = async () => {
            try {
                const res = await factoryApi.getAll();
                setFactories(res.data.data);
            } catch (error) {
                logger.error('Failed to load factories:', error);
            }
        };
        loadFactories();
    }, []);

    const fetchTrends = async () => {
        setLoadingTrends(true);
        try {
            const res = await reportApi.getQualityTrends({
                id_factory: selectedFactory ? Number(selectedFactory) : undefined,
                start_date: startDate,
                end_date: endDate
            });

            const rawData = res.data?.data || [];
            const groupedData: Record<string, any> = {};

            rawData.forEach((item: any) => {
                const date = format(new Date(item.analysis_date), 'dd/MM');
                if (!groupedData[date]) {
                    groupedData[date] = {
                        date,
                        moisture: 0,
                        density: 0,
                        green: 0,
                        yellow: 0,
                        kw1: 0,
                        kw2: 0,
                        kw3: 0,
                        reject: 0,
                        count: 0
                    };
                }
                groupedData[date].moisture += Number(item.moisture_value || 0);
                groupedData[date].density += Number(item.density_value || 0);
                groupedData[date].green += Number(item.green_percentage || 0);
                groupedData[date].yellow += Number(item.yellow_percentage || 0);

                const gradeStr = String(item.final_grade || '').toUpperCase();
                if (gradeStr.includes('KW 1')) groupedData[date].kw1 += 1;
                else if (gradeStr.includes('KW 2')) groupedData[date].kw2 += 1;
                else if (gradeStr.includes('KW 3')) groupedData[date].kw3 += 1;
                else if (gradeStr.includes('REJECT')) groupedData[date].reject += 1;

                groupedData[date].count += 1;
            });

            const chartData = Object.values(groupedData).map((group: any) => ({
                ...group,
                moisture: Number((group.moisture / group.count).toFixed(2)),
                density: Number((group.density / group.count).toFixed(2)),
                green: Number((group.green / group.count).toFixed(2)),
                yellow: Number((group.yellow / group.count).toFixed(2)),
            }));

            setTrendData(chartData);
        } catch (error: any) {
            logger.error('Failed to fetch quality trends:', error);
            showError('Error', 'Gagal mengambil data tren kualitas');
        } finally {
            setLoadingTrends(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'trends') {
            fetchTrends();
        }
    }, [selectedFactory, startDate, endDate, activeTab]);

    // ==========================================
    // ANALYZE STATE
    // ==========================================
    const [loadingAnalyze, setLoadingAnalyze] = useState(false);
    const [_imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [supplier, setSupplier] = useState('');
    const [lot, setLot] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreview(ev.target?.result as string);
            };
            reader.readAsDataURL(file);

            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;
        setLoadingAnalyze(true);
        try {
            const res = await qcGabahApi.analyze({
                image_base64: imagePreview,
                supplier,
                lot
            });
            setResult(res.data);
            showSuccess('Analisis Berhasil', 'Kualitas gabah telah teridentifikasi');
        } catch (err: any) {
            logger.error(err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze image";
            showError('Analisis Gagal', errorMessage);
        } finally {
            setLoadingAnalyze(false);
        }
    };

    const gradeStyle = result ? (GRADE_COLORS[result.grade] || GRADE_COLORS['KW 3']) : null;

    return (
        <div className="page-content">
            {/* Tabs Header */}
            <div className="card mb-6" style={{ padding: '6px', display: 'flex', gap: '8px', background: 'var(--bg-surface-secondary)' }}>
                <button
                    className={`btn ${activeTab === 'trends' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, height: '48px', background: activeTab === 'trends' ? 'var(--primary)' : 'transparent', color: activeTab === 'trends' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: activeTab === 'trends' ? 600 : 500 }}
                    onClick={() => setActiveTab('trends')}
                >
                    <TrendingUp size={20} style={{ marginRight: '8px' }} />
                    Tren QC (Historis)
                </button>
                <button
                    className={`btn ${activeTab === 'analyze' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, height: '48px', background: activeTab === 'analyze' ? 'var(--primary)' : 'transparent', color: activeTab === 'analyze' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: activeTab === 'analyze' ? 600 : 500 }}
                    onClick={() => setActiveTab('analyze')}
                >
                    <span className="material-symbols-outlined icon-sm" style={{ marginRight: '8px' }}>science</span>
                    Analisis Sampel (AI)
                </button>
            </div>

            {/* TAB: TRENDS */}
            {activeTab === 'trends' && (
                <div className="trends-container">
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

                    {loadingTrends && trendData.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <LogoLoader small text="Memuat grafik tren kualitas..." />
                        </div>
                    ) : trendData.length === 0 ? (
                        <div className="card" style={{ padding: '80px 24px', textAlign: 'center' }}>
                            <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <h3 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Belum Ada Data Historis</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Tidak ditemukan riwayat Quality Analysis untuk filter yang dipilih.</p>
                        </div>
                    ) : (
                        <div className="grid-2" style={{ gap: '24px' }}>
                            {/* Chart 1: Tren KW */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={18} color="#f59e0b" />
                                        Tren Quality Grade (KW)
                                    </h3>
                                    <span className="badge badge-warning">Count</span>
                                </div>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="kw1" stackId="a" name="KW 1" fill="#22c55e" />
                                            <Bar dataKey="kw2" stackId="a" name="KW 2" fill="#eab308" />
                                            <Bar dataKey="kw3" stackId="a" name="KW 3" fill="#ef4444" />
                                            <Bar dataKey="reject" stackId="a" name="REJECT" fill="#7f1d1d" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Tren Warna */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={18} color="#8b5cf6" />
                                        Tren Warna Gabah
                                    </h3>
                                    <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>%</span>
                                </div>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="yellow" name="Kuning (%)" fill="#eab308" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="green" name="Hijau (%)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 3: Tren Kadar Air */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Droplets size={18} color="#3b82f6" />
                                        Tren Kadar Air
                                    </h3>
                                    <span className="badge badge-info">%</span>
                                </div>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
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

                            {/* Chart 4: Tren Densitas (Berat) */}
                            <div className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BarChart2 size={18} color="#10b981" />
                                        Tren Berat / Densitas
                                    </h3>
                                    <span className="badge badge-success">g/L</span>
                                </div>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
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
                    )}
                </div>
            )}

            {/* TAB: ANALYZE */}
            {activeTab === 'analyze' && (
                <div className="grid-2">
                    {/* Input Section */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Upload Sampel</h3>
                            <p className="card-subtitle">Analisis berbasis AI Vision</p>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nama Supplier"
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Lot / Batch Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Kode Lot"
                                    value={lot}
                                    onChange={(e) => setLot(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Foto Sampel</label>
                                <div style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 12,
                                    padding: 24,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'var(--bg-surface-secondary)',
                                    transition: 'all 0.2s ease'
                                }} onClick={() => document.getElementById('file-upload')?.click()}>

                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}
                                        />
                                    ) : (
                                        <div style={{ padding: 40 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>add_photo_alternate</span>
                                            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Klik atau seret foto ke sini</p>
                                        </div>
                                    )}

                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                                disabled={!imagePreview || loadingAnalyze}
                                onClick={handleAnalyze}
                            >
                                {loadingAnalyze ? (
                                    <>
                                        <span className="material-symbols-outlined spin" style={{ marginRight: 8 }}>refresh</span>
                                        Menganalisis...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ marginRight: 8 }}>analytics</span>
                                        Analisis Kualitas
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result Section */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Hasil Analisis</h3>
                            <p className="card-subtitle">Estimasi kualitas berdasarkan visual</p>
                        </div>
                        <div style={{ padding: 24 }}>
                            {result && gradeStyle ? (
                                <div>
                                    {/* Grade Display */}
                                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                        <div style={{
                                            background: gradeStyle.bg,
                                            color: gradeStyle.text,
                                            padding: '32px 24px',
                                            borderRadius: 16,
                                            display: 'inline-block',
                                            minWidth: 240,
                                            border: `2px solid ${gradeStyle.border}`
                                        }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>
                                                Predicted Grade
                                            </div>
                                            <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
                                                {result.grade}
                                            </div>
                                            {result.level > 0 && (
                                                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 4, opacity: 0.7 }}>
                                                    Level {result.level}
                                                </div>
                                            )}
                                            <div style={{
                                                marginTop: 12,
                                                padding: '4px 16px',
                                                borderRadius: 20,
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                display: 'inline-block',
                                                background: result.status === 'OK' ? 'rgba(34,197,94,0.2)' :
                                                    result.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                                                color: result.status === 'OK' ? '#166534' :
                                                    result.status === 'REJECTED' ? '#991b1b' : '#854d0e',
                                            }}>
                                                {result.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stacked Color Bar */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Distribusi Warna</span>
                                        </div>
                                        <div style={{
                                            height: 28,
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            background: 'var(--bg-surface-secondary)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {COLOR_BAR_ITEMS.map(item => {
                                                const val = (result as any)[item.key] ?? 0;
                                                if (val <= 0) return null;
                                                return (
                                                    <div
                                                        key={item.key}
                                                        title={`${item.label}: ${val}%`}
                                                        style={{
                                                            width: `${val}%`,
                                                            background: item.color,
                                                            transition: 'width 1s ease-out',
                                                            position: 'relative',
                                                            minWidth: val > 3 ? 'auto' : 0
                                                        }}
                                                    >
                                                        {val >= 8 && (
                                                            <span style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                color: ['#eab308', '#d1d5db'].includes(item.color) ? '#000' : '#fff',
                                                            }}>
                                                                {val}%
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Color Legend */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 8,
                                        marginBottom: 20,
                                    }}>
                                        {COLOR_BAR_ITEMS.map(item => {
                                            const val = (result as any)[item.key] ?? 0;
                                            return (
                                                <div key={item.key} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '6px 10px',
                                                    borderRadius: 8,
                                                    background: val > 0 ? 'var(--bg-surface-secondary)' : 'transparent',
                                                    opacity: val > 0 ? 1 : 0.4,
                                                }}>
                                                    <div style={{
                                                        width: 12, height: 12, borderRadius: 3,
                                                        background: item.color,
                                                        border: item.color === '#d1d5db' ? '1px solid var(--border-color)' : 'none',
                                                        flexShrink: 0,
                                                    }} />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{val}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Defect Warning */}
                                    {(result.defect_percentage ?? 0) > 0 && (
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: 10,
                                            marginBottom: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            background: (result.defect_percentage ?? 0) > 10
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : (result.defect_percentage ?? 0) > 5
                                                    ? 'rgba(234, 179, 8, 0.1)'
                                                    : 'rgba(59, 130, 246, 0.1)',
                                            border: `1px solid ${(result.defect_percentage ?? 0) > 10
                                                ? 'rgba(239, 68, 68, 0.3)'
                                                : (result.defect_percentage ?? 0) > 5
                                                    ? 'rgba(234, 179, 8, 0.3)'
                                                    : 'rgba(59, 130, 246, 0.3)'}`,
                                        }}>
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: 20,
                                                color: (result.defect_percentage ?? 0) > 10 ? '#ef4444' :
                                                    (result.defect_percentage ?? 0) > 5 ? '#eab308' : '#3b82f6',
                                            }}>
                                                {(result.defect_percentage ?? 0) > 10 ? 'error' : 'warning'}
                                            </span>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    Defect Total: {result.defect_percentage}%
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    Rusak: {result.damaged_percentage ?? 0}% · Busuk: {result.rotten_percentage ?? 0}%
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="alert alert-info">
                                        <span className="material-symbols-outlined icon-sm">info</span>
                                        <p style={{ fontSize: '0.85rem' }}>
                                            Grade ditentukan dari 3 faktor: persentase kuning (min), defect/kerusakan (maks), dan butir hijau/mentah (maks). Grade = worst-case dari ketiga faktor.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: 0.5,
                                    minHeight: 300,
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: 80, height: 80, borderRadius: '50%',
                                        background: 'var(--bg-surface-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 16
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 40 }}>query_stats</span>
                                    </div>
                                    <h3>Belum Ada Data</h3>
                                    <p>Silakan upload foto dan klik tombol analisis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QCGabah;
