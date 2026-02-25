import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportApi, factoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface ProductionData {
    total_input: number;
    total_output: number;
    avg_rendemen: number;
    worksheet_count: number;
    total_menir: number;
    total_dedak: number;
    total_sekam: number;
}

const RendemenMonitor = () => {
    const { showError } = useToast();
    const [data, setData] = useState<ProductionData | null>(null);
    const [factories, setFactories] = useState<{ id: number; code: string; name: string }[]>([]);
    const [factoryData, setFactoryData] = useState<Record<number, ProductionData>>({});
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
    const [loading, setLoading] = useState(true);

    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (period === '7d') start.setDate(end.getDate() - 7);
        else if (period === '30d') start.setDate(end.getDate() - 30);
        else start.setDate(end.getDate() - 90);
        return {
            start_date: start.toISOString().slice(0, 10),
            end_date: end.toISOString().slice(0, 10)
        };
    }, [period]);

    useEffect(() => {
        factoryApi.getAll().then(r => {
            const d = r.data?.data || r.data || [];
            const pmd = d.filter((f: any) => f.code?.startsWith('PMD'));
            setFactories(pmd);
        }).catch(() => { });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { ...dateRange };
            if (selectedFactory) params.id_factory = Number(selectedFactory);

            const res = await reportApi.getProductionSummary(params);
            const d = res.data?.data || res.data;
            setData(d);

            // Fetch per-factory data for comparison
            if (!selectedFactory && factories.length > 0) {
                const perFactory: Record<number, ProductionData> = {};
                await Promise.all(factories.map(async (f) => {
                    try {
                        const fr = await reportApi.getProductionSummary({ ...dateRange, id_factory: f.id });
                        perFactory[f.id] = fr.data?.data || fr.data;
                    } catch { /* skip */ }
                }));
                setFactoryData(perFactory);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data rendemen');
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedFactory, factories, showError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const rendemen = data?.avg_rendemen || 0;
    const target = 60; // target rendemen 60%
    const isAboveTarget = rendemen >= target;

    const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));

    return (
        <div className="page-content">
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                {(['7d', '30d', '90d'] as const).map(p => (
                    <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPeriod(p)}>
                        {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <select className="form-input" value={selectedFactory} onChange={e => setSelectedFactory(e.target.value)} style={{ minWidth: 180 }}>
                    <option value="">Semua Pabrik</option>
                    {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 48 }}>hourglass_empty</span>
                    <div style={{ marginTop: 8 }}>Memuat data rendemen...</div>
                </div>
            ) : (
                <>
                    {/* Main Rendemen Card */}
                    <div className="card" style={{ padding: 32, marginBottom: 24, textAlign: 'center', background: isAboveTarget ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 8 }}>RATA-RATA RENDEMEN</div>
                        <div style={{ fontSize: 56, fontWeight: 800, color: isAboveTarget ? '#16a34a' : '#dc2626', fontFamily: 'monospace' }}>
                            {rendemen.toFixed(1)}%
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: isAboveTarget ? '#16a34a' : '#dc2626', fontSize: 20 }}>
                                {isAboveTarget ? 'trending_up' : 'trending_down'}
                            </span>
                            <span style={{ color: isAboveTarget ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                {isAboveTarget ? 'Di atas' : 'Di bawah'} target ({target}%)
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-4" style={{ marginBottom: 24 }}>
                        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL GABAH INPUT</div>
                            <div className="text-xl font-bold font-mono">{formatNumber(data?.total_input || 0)} kg</div>
                        </div>
                        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL BERAS OUTPUT</div>
                            <div className="text-xl font-bold font-mono text-success">{formatNumber(data?.total_output || 0)} kg</div>
                        </div>
                        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>JUMLAH WORKSHEET</div>
                            <div className="text-xl font-bold">{data?.worksheet_count || 0}</div>
                        </div>
                        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>SIDE PRODUCTS</div>
                            <div className="text-sm font-mono" style={{ marginTop: 4 }}>
                                Menir: {formatNumber(data?.total_menir || 0)} kg<br />
                                Dedak: {formatNumber(data?.total_dedak || 0)} kg<br />
                                Sekam: {formatNumber(data?.total_sekam || 0)} kg
                            </div>
                        </div>
                    </div>

                    {/* Per-Factory Comparison */}
                    {!selectedFactory && factories.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Perbandingan Rendemen per Pabrik</h3>
                            </div>
                            <div className="table-container">
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="text-left">Pabrik</th>
                                            <th className="text-right">Gabah Input</th>
                                            <th className="text-right">Beras Output</th>
                                            <th className="text-right">Rendemen</th>
                                            <th className="text-right">Worksheet</th>
                                            <th className="text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {factories.map(f => {
                                            const fd = factoryData[f.id];
                                            const r = fd?.avg_rendemen || 0;
                                            const ok = r >= target;
                                            return (
                                                <tr key={f.id}>
                                                    <td className="font-medium">{f.name}</td>
                                                    <td className="text-right font-mono">{formatNumber(fd?.total_input || 0)} kg</td>
                                                    <td className="text-right font-mono">{formatNumber(fd?.total_output || 0)} kg</td>
                                                    <td className="text-right font-mono font-bold" style={{ color: ok ? '#16a34a' : '#dc2626' }}>{r.toFixed(1)}%</td>
                                                    <td className="text-right">{fd?.worksheet_count || 0}</td>
                                                    <td className="text-center">
                                                        <span className={`badge ${ok ? 'badge-success' : 'badge-error'}`}>
                                                            {ok ? '✓ Target' : '✗ Bawah Target'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RendemenMonitor;
