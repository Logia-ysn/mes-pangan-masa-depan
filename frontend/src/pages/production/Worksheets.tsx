import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { worksheetApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';
import { logger } from '../../utils/logger';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import { formatDate, formatNumber, formatCurrency } from '../../utils/formatUtils';
import type { Worksheet } from '../../features/production/worksheet/types/worksheet.types';
import { shiftConfig, statusConfig, STATUS_FILTERS } from '../../features/production/worksheet/config/worksheet.config';


const Worksheets = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    // Pagination & Factory hook
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const {
        selectedFactory,
        setSelectedFactory,
        factories,
        loading: factoryLoading
    } = useFactory();

    useEffect(() => {
        if (!factoryLoading) {
            fetchWorksheets();
        }
    }, [selectedFactory, page, statusFilter, startDate, endDate, factoryLoading]);

    const fetchWorksheets = async () => {
        try {
            setLoading(true);
            const res = await worksheetApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined,
                status: statusFilter || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            });
            const data = (res as any).data?.data || (res as any).data?.worksheets || (res as any).data || (res as any).worksheets || [];
            const total = (res as any).data?.total || (res as any).total || data.length || 0;

            setWorksheets(data);
            setTotalItems(total);

            if (!statusFilter) {
                const pending = data.filter((w: Worksheet) => w.status === 'SUBMITTED').length;
                setPendingCount(pending);
            }
        } catch (err: any) {
            showError('Gagal', err.message || 'Gagal mengambil data worksheet');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (e: React.MouseEvent, id: number, batchCode?: string) => {
        e.stopPropagation();
        try {
            const res = await worksheetApi.downloadPdf(id);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${batchCode || `worksheet-${id}`}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            showError('Gagal', 'Gagal mendownload PDF');
        }
    };

    const handleDelete = async (id: number, status: string) => {
        if (!['DRAFT', 'REJECTED', 'CANCELLED'].includes(status)) {
            showError('Tidak Bisa', `Worksheet status "${statusConfig[status]?.label || status}" tidak bisa dihapus. Gunakan Cancel terlebih dahulu.`);
            return;
        }
        if (window.confirm('Hapus worksheet ini?')) {
            try {
                await worksheetApi.delete(id);
                showSuccess('Berhasil', 'Worksheet berhasil dihapus');
                fetchWorksheets();
            } catch (error: any) {
                logger.error('Error deleting worksheet:', error);
                showError('Gagal', error?.response?.data?.error?.message || 'Gagal menghapus worksheet');
            }
        }
    };

    const totalInput = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.gabah_input || 0), 0), [worksheets]);
    const totalOutput = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.beras_output || 0), 0), [worksheets]);
    const totalHPP = useMemo(() => worksheets.reduce((sum, w) => sum + Number(w.hpp || 0), 0), [worksheets]);
    // const pendingCount = useMemo(() => worksheets.filter(w => w.status === 'SUBMITTED').length, [worksheets]); // This is now a state variable

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const StatusBadge = ({ status }: { status: string }) => {
        const cfg = statusConfig[status] || { label: status, color: '#374151', bg: '#e5e7eb' };
        return (
            <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: cfg.color,
                backgroundColor: cfg.bg,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
            }}>
                {cfg.label}
            </span>
        );
    };

    return (
        <div className="page-content">
            {/* Factory Toggle + Status Filter Row */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="factory-selector-scroll">
                    <button
                        className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setSelectedFactory(null); setPage(1); }}
                    >
                        <span className="material-symbols-outlined icon-sm">apps</span>
                        Semua
                    </button>
                    {factories.map(factory => (
                        <button
                            key={factory.id}
                            className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setSelectedFactory(factory.id); setPage(1); }}
                        >
                            <span className="material-symbols-outlined icon-sm">factory</span>
                            {factory.name}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Status filter */}
                    <select
                        className="form-input"
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        style={{ minWidth: 180, height: 36, fontSize: '0.8rem', paddingTop: 0, paddingBottom: 0 }}
                        id="status-filter"
                    >
                        {STATUS_FILTERS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#f9fafb', padding: '2px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <span className="material-symbols-outlined icon-xs text-muted">calendar_month</span>
                        <input
                            type="date"
                            className="form-input-clean"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); setPage(1); }}
                            style={{ width: 115, border: 'none', background: 'transparent', fontSize: '0.75rem' }}
                        />
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>ke</span>
                        <input
                            type="date"
                            className="form-input-clean"
                            value={endDate}
                            onChange={e => { setEndDate(e.target.value); setPage(1); }}
                            style={{ width: 115, border: 'none', background: 'transparent', fontSize: '0.75rem', paddingRight: 0 }}
                        />
                        {(startDate || endDate) && (
                            <button
                                className="btn btn-ghost btn-icon btn-xs"
                                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                                title="Reset Filter Tanggal"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                            </button>
                        )}
                    </div>

                    {selectedFactory && (
                        <button className="btn btn-primary" onClick={() => navigate('/production/worksheets/new')}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            New Entry
                        </button>
                    )}
                </div>
            </div>

            {/* Pending Approval Alert */}
            {pendingCount > 0 && !statusFilter && (
                <div style={{
                    background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 8,
                    padding: '10px 16px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>pending_actions</span>
                    <span style={{ fontWeight: 600 }}>{pendingCount} worksheet menunggu approval</span>
                    <button
                        className="btn btn-sm"
                        style={{ marginLeft: 'auto', background: '#1d4ed8', color: '#fff', padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => setStatusFilter('SUBMITTED')}
                    >
                        Lihat
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Data</span>
                        <span className="material-symbols-outlined stat-card-icon">assignment</span>
                    </div>
                    <div className="stat-card-value">{formatNumber(totalItems)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Input (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">inventory_2</span>
                    </div>
                    <div className="stat-card-value">{formatNumber(totalInput)} kg</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Output (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">grain</span>
                    </div>
                    <div className="stat-card-value">{formatNumber(totalOutput)} kg</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total HPP (Page)</span>
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
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Input</th>
                                <th style={{ textAlign: 'right' }}>Output</th>
                                <th className="hide-mobile" style={{ textAlign: 'right' }}>Yield</th>
                                <th style={{ textAlign: 'right' }}>HPP</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                            ) : worksheets.length === 0 ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                            ) : worksheets.map(w => (
                                <tr key={w.id} style={w.status === 'CANCELLED' ? { opacity: 0.55 } : undefined}>
                                    <td>{formatDate(w.worksheet_date)}</td>
                                    <td className="hide-mobile"><span className="badge badge-default">{w.batch_code || '-'}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>
                                            {(w as any).ProductType?.name || (w as any).otm_id_output_product?.name || '-'}
                                        </div>
                                        {w.status === 'REJECTED' && w.rejection_reason && (
                                            <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: 2 }}>
                                                ✗ {w.rejection_reason}
                                            </div>
                                        )}
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
                                    <td><StatusBadge status={w.status} /></td>
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
                                                {formatCurrency(Number(w.hpp) / Number(w.beras_output))}/kg
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            <button
                                                id={`view-ws-${w.id}`}
                                                className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => navigate(`/production/worksheets/${w.id}`)}
                                                title="Lihat Detail"
                                            >
                                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>visibility</span>
                                            </button>
                                            {['DRAFT', 'REJECTED'].includes(w.status) && (
                                                <button
                                                    id={`edit-ws-${w.id}`}
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => navigate(`/production/worksheets/${w.id}/edit`)}
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>edit</span>
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-ghost btn-icon btn-sm"
                                                onClick={(e) => handleDownloadPdf(e, w.id, w.batch_code)}
                                                title="Download PDF"
                                            >
                                                <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>picture_as_pdf</span>
                                            </button>
                                            {['DRAFT', 'REJECTED', 'CANCELLED'].includes(w.status) && (
                                                <button
                                                    id={`delete-ws-${w.id}`}
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => handleDelete(w.id, w.status)}
                                                    title="Hapus"
                                                >
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>
        </div>
    );
};

export default Worksheets;
