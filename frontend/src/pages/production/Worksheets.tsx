import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import Header from '../../components/Layout/Header';
import { worksheetApi, factoryApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { logger } from '../../utils/logger';

interface Worksheet {
    id: number;
    id_factory: number;
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
    process_steps?: string;
    batch_code?: string;
    production_cost?: number;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    otm_id_factory?: { id: number; name: string; code: string };
    otm_id_output_product?: { id: number; code: string; name: string };
    otm_id_machine?: { id: number; name: string };
    otm_id_user?: { id: number; fullname: string };
    side_products?: any[];
    notes?: string;
}

interface Factory {
    id: number;
    code: string;
    name: string;
}

const shiftConfig: { [key: string]: { label: string; class: string } } = {
    SHIFT_1: { label: 'Shift 1', class: 'badge-info' },
    SHIFT_2: { label: 'Shift 2', class: 'badge-warning' },
    SHIFT_3: { label: 'Shift 3', class: 'badge-muted' },
    SHIFT_4: { label: 'Shift 4', class: 'badge-success' }
};

const Worksheets = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchWorksheets();
    }, [selectedFactory]);

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
            logger.error('Error:', error);
        }
    };

    const fetchWorksheets = async () => {
        try {
            setLoading(true);
            const res = await worksheetApi.getAll({
                limit: 50,
                id_factory: selectedFactory || undefined
            });
            setWorksheets(res.data.data || res.data || []);
        } catch (error) {
            logger.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Hapus worksheet ini?')) {
            try {
                await worksheetApi.delete(id);
                showSuccess('Berhasil', 'Worksheet berhasil dihapus');
                fetchWorksheets();
            } catch (error) {
                logger.error('Error deleting worksheet:', error);
                showError('Gagal', 'Gagal menghapus worksheet');
            }
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatNumber = (num: number) =>
        new Intl.NumberFormat('id-ID').format(Number(num));

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(num));

    const totalInput = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.gabah_input || 0), 0), [worksheets]);
    const totalOutput = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.beras_output || 0), 0), [worksheets]);
    const totalHPP = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.hpp || 0), 0), [worksheets]);

    const selectedFactoryData = factories.find(f => f.id === selectedFactory);

    return (
        <>
            <Header title="Worksheet Produksi" subtitle={`Kelola data worksheet harian - ${selectedFactoryData?.name || 'Semua Pabrik'}`} />

            <div className="page-content">
                {/* Factory Toggle */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
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

                    {selectedFactory && (
                        <button className="btn btn-primary" onClick={() => navigate('/production/worksheets/new')}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            New Entry
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Worksheet</span>
                            <span className="material-symbols-outlined stat-card-icon">assignment</span>
                        </div>
                        <div className="stat-card-value">{worksheets.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Input</span>
                            <span className="material-symbols-outlined stat-card-icon">inventory_2</span>
                        </div>
                        <div className="stat-card-value">{formatNumber(totalInput)} kg</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Output</span>
                            <span className="material-symbols-outlined stat-card-icon">grain</span>
                        </div>
                        <div className="stat-card-value">{formatNumber(totalOutput)} kg</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total HPP</span>
                            <span className="material-symbols-outlined stat-card-icon">payments</span>
                        </div>
                        <div className="stat-card-value">{formatCurrency(totalHPP)}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Daftar Worksheet</h3>
                        <button className="btn btn-secondary" onClick={() => exportToCSV(worksheets, 'worksheets')}>
                            <span className="material-symbols-outlined icon-sm">download</span>
                            Export
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th className="hide-mobile">Batch</th>
                                    <th>Product</th>
                                    <th>Shift</th>
                                    <th style={{ textAlign: 'right' }}>Input</th>
                                    <th style={{ textAlign: 'right' }}>Output</th>
                                    <th className="hide-mobile" style={{ textAlign: 'right' }}>Yield</th>
                                    <th style={{ textAlign: 'right' }}>HPP</th>
                                    <th style={{ textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center' }}>Loading...</td></tr>
                                ) : worksheets.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                                ) : worksheets.map(w => (
                                    <tr key={w.id}>
                                        <td>{formatDate(w.worksheet_date)}</td>
                                        <td className="hide-mobile"><span className="badge badge-default">{w.batch_code || '-'}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>
                                                {w.otm_id_output_product?.name || '-'}
                                            </div>
                                            {w.side_products && w.side_products.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                                                    {w.side_products.map((sp: any, idx: number) => (
                                                        <div key={idx} style={{ color: 'var(--text-muted)' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '10px', verticalAlign: 'middle', marginRight: 2 }}>subdirectory_arrow_right</span>
                                                            {sp.product_name}: {formatNumber(sp.quantity)} kg
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td><span className={`badge ${shiftConfig[w.shift]?.class || 'badge-muted'}`}>{shiftConfig[w.shift]?.label.split(' ')[0] || w.shift}</span></td>
                                        <td style={{ textAlign: 'right' }}>{formatNumber(w.gabah_input)} kg</td>
                                        <td style={{ textAlign: 'right' }}>{formatNumber(w.beras_output)} kg</td>
                                        <td className="hide-mobile" style={{ textAlign: 'right' }}>
                                            <span className={`badge ${Number(w.rendemen) >= 60 ? 'badge-success' : 'badge-warning'}`}>
                                                {Number(w.rendemen || 0).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div>{w.hpp ? formatCurrency(w.hpp) : '-'}</div>
                                            {w.hpp && w.beras_output > 0 && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {formatCurrency(w.hpp / w.beras_output)}/kg
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/production/worksheets/${w.id}`)}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>visibility</span>
                                                </button>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/production/worksheets/${w.id}/edit`)}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>edit</span>
                                                </button>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(w.id)}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Worksheets;
