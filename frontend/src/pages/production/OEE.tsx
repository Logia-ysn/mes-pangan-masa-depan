import { useState, useEffect } from 'react';

import api, { factoryApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Worksheet {
    id: number;
    worksheet_date: string;
    shift: string;
    gabah_input: number;
    beras_output: number;
    menir_output: number;
    dedak_output: number;
    sekam_output: number;
    rendemen: number;
    machine_hours: number;
    downtime_hours: number;
}

interface Machine {
    id: number;
    name: string;
    status: string;
    capacity_per_hour: number;
}

interface Factory {
    id: number;
    code: string;
    name: string;
}

const OEE = () => {
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('daily');

    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);

    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const res = await factoryApi.getAll();
                const data = res.data?.data || res.data || [];
                const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
                setFactories(pmdFactories);
                const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
                if (pmd1) setSelectedFactory(pmd1.id);
                else if (pmdFactories.length > 0) setSelectedFactory(pmdFactories[0].id);
            } catch (error) {
                logger.error('Error fetching factories:', error);
            }
        };
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedFactory]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [worksheetsRes, machinesRes] = await Promise.all([
                api.get('/worksheets', { params: { limit: 100, id_factory: selectedFactory || undefined } }),
                api.get('/machines', { params: { id_factory: selectedFactory || undefined } })
            ]);
            // Handle both array and paginated response formats
            const worksheetsData = worksheetsRes.data?.data || worksheetsRes.data || [];
            setWorksheets(Array.isArray(worksheetsData) ? worksheetsData : []);
            const machinesData = machinesRes.data?.data || machinesRes.data || [];
            setMachines(Array.isArray(machinesData) ? machinesData : []);
        } catch (error) {
            logger.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    // Calculate OEE metrics
    const calculateOEE = () => {
        if (worksheets.length === 0) return { availability: 0, performance: 0, quality: 0, oee: 0 };

        // Sum all values
        const totalMachineHours = worksheets.reduce((sum, w) => sum + (w.machine_hours || 0), 0);
        const totalDowntimeHours = worksheets.reduce((sum, w) => sum + (w.downtime_hours || 0), 0);
        const totalBerasOutput = worksheets.reduce((sum, w) => sum + (w.beras_output || 0), 0);

        const totalMenirOutput = worksheets.reduce((sum, w) => sum + (w.menir_output || 0), 0);
        const totalDedakOutput = worksheets.reduce((sum, w) => sum + (w.dedak_output || 0), 0);

        // Availability: (Machine Hours - Downtime) / Machine Hours
        const plannedTime = totalMachineHours;
        const runTime = totalMachineHours - totalDowntimeHours;
        const availability = plannedTime > 0 ? (runTime / plannedTime) * 100 : 0;

        // Performance: Actual Output / (Run Time * Ideal Rate)
        // Assuming ideal rate of 1000 kg/hour
        const idealRate = 1000;
        const actualOutput = totalBerasOutput + totalMenirOutput + totalDedakOutput;
        const theoreticalOutput = runTime * idealRate;
        const performance = theoreticalOutput > 0 ? Math.min((actualOutput / theoreticalOutput) * 100, 100) : 0;

        // Quality: Good Output / Total Output (Beras is primary product)
        const totalOutput = totalBerasOutput + totalMenirOutput + totalDedakOutput;
        const quality = totalOutput > 0 ? (totalBerasOutput / totalOutput) * 100 : 0;

        // OEE = Availability × Performance × Quality
        const oee = (availability * performance * quality) / 10000;

        return {
            availability: Math.round(availability),
            performance: Math.round(performance),
            quality: Math.round(quality),
            oee: Math.round(oee)
        };
    };

    const oeeMetrics = calculateOEE();

    // Production stats
    const totalProduction = worksheets.reduce((sum, w) => sum + (w.beras_output || 0), 0);
    const avgRendemen = worksheets.length > 0
        ? worksheets.reduce((sum, w) => sum + (w.rendemen || 0), 0) / worksheets.length
        : 0;

    // Machine stats
    const activeMachines = machines.filter(m => m.status === 'ACTIVE').length;
    const totalMachines = machines.length;

    const getOEEColor = (value: number) => {
        if (value >= 85) return 'var(--success)';
        if (value >= 60) return 'var(--warning)';
        return 'var(--error)';
    };

    const getOEEStatus = (value: number) => {
        if (value >= 85) return { label: 'World Class', class: 'badge-success' };
        if (value >= 60) return { label: 'Average', class: 'badge-warning' };
        return { label: 'Perlu Perbaikan', class: 'badge-error' };
    };

    if (loading) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                </div>
            </>
        );
    }


    return (
        <>
            <div className="page-content">
                {/* Factory Toggle */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

                {/* Period Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Production Performance</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Metrik efektivitas peralatan dan produksi
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
                        {['daily', 'weekly', 'monthly'].map((p) => (
                            <button
                                key={p}
                                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* OEE Main Card */}
                <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: 48 }}>
                    <div style={{ marginBottom: 24 }}>
                        <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--text-muted)'
                        }}>
                            Overall Equipment Effectiveness
                        </span>
                    </div>

                    {/* OEE Gauge */}
                    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 24px' }}>
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="transparent"
                                stroke="var(--bg-elevated)"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="transparent"
                                stroke={getOEEColor(oeeMetrics.oee)}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${oeeMetrics.oee * 2.64} 264`}
                                style={{ transition: 'stroke-dasharray 0.5s ease' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getOEEColor(oeeMetrics.oee) }}>
                                {oeeMetrics.oee}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                OEE Score
                            </div>
                        </div>
                    </div>

                    <span className={`badge ${getOEEStatus(oeeMetrics.oee).class}`} style={{ marginBottom: 16 }}>
                        {getOEEStatus(oeeMetrics.oee).label}
                    </span>
                </div>

                {/* OEE Components */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    {/* Availability */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Availability</span>
                            <span className="material-symbols-outlined stat-card-icon">schedule</span>
                        </div>
                        <div className="stat-card-value" style={{ color: getOEEColor(oeeMetrics.availability) }}>
                            {oeeMetrics.availability}%
                        </div>
                        <div className="stat-card-progress">
                            <div
                                className="stat-card-progress-bar"
                                style={{ width: `${oeeMetrics.availability}%`, background: getOEEColor(oeeMetrics.availability) }}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                            Waktu beroperasi vs waktu terjadwal
                        </p>
                    </div>

                    {/* Performance */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Performance</span>
                            <span className="material-symbols-outlined stat-card-icon">speed</span>
                        </div>
                        <div className="stat-card-value" style={{ color: getOEEColor(oeeMetrics.performance) }}>
                            {oeeMetrics.performance}%
                        </div>
                        <div className="stat-card-progress">
                            <div
                                className="stat-card-progress-bar"
                                style={{ width: `${oeeMetrics.performance}%`, background: getOEEColor(oeeMetrics.performance) }}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                            Kecepatan aktual vs kecepatan ideal
                        </p>
                    </div>

                    {/* Quality */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Quality</span>
                            <span className="material-symbols-outlined stat-card-icon">verified</span>
                        </div>
                        <div className="stat-card-value" style={{ color: getOEEColor(oeeMetrics.quality) }}>
                            {oeeMetrics.quality}%
                        </div>
                        <div className="stat-card-progress">
                            <div
                                className="stat-card-progress-bar"
                                style={{ width: `${oeeMetrics.quality}%`, background: getOEEColor(oeeMetrics.quality) }}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                            Produk baik vs total produksi
                        </p>
                    </div>

                    {/* Rendemen */}
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Avg Rendemen</span>
                            <span className="material-symbols-outlined stat-card-icon">grain</span>
                        </div>
                        <div className="stat-card-value">{avgRendemen.toFixed(1)}%</div>
                        <span className="badge badge-success">
                            <span className="material-symbols-outlined icon-sm">trending_up</span>
                            Target: 65%
                        </span>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-2" style={{ gap: 24 }}>
                    {/* Machine Status */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Status Mesin</h3>
                                <p className="card-subtitle">Ketersediaan mesin produksi</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {machines.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>
                                    Belum ada data mesin
                                </p>
                            ) : (
                                machines.slice(0, 5).map((machine) => (
                                    <div key={machine.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: machine.status === 'ACTIVE' ? 'var(--success)' :
                                                    machine.status === 'MAINTENANCE' ? 'var(--warning)' : 'var(--error)'
                                            }} />
                                            <span className="font-medium">{machine.name}</span>
                                        </div>
                                        <span className={`badge ${machine.status === 'ACTIVE' ? 'badge-success' :
                                            machine.status === 'MAINTENANCE' ? 'badge-warning' : 'badge-error'
                                            }`}>
                                            {machine.status === 'ACTIVE' ? 'Aktif' :
                                                machine.status === 'MAINTENANCE' ? 'Maintenance' : 'Tidak Aktif'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Mesin Aktif</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeMachines}/{totalMachines}</span>
                        </div>
                    </div>

                    {/* Production Summary */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Ringkasan Produksi</h3>
                                <p className="card-subtitle">Total output produksi</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>grain</span>
                                    <span>Total Beras</span>
                                </div>
                                <span className="font-bold font-mono">{totalProduction.toLocaleString()} kg</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>assignment</span>
                                    <span>Total Worksheet</span>
                                </div>
                                <span className="font-bold font-mono">{worksheets.length}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>trending_up</span>
                                    <span>Avg Output/Shift</span>
                                </div>
                                <span className="font-bold font-mono">
                                    {worksheets.length > 0 ? Math.round(totalProduction / worksheets.length).toLocaleString() : 0} kg
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OEE;
