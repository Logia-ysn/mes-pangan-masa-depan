import React, { useState, useEffect } from 'react';
import { auditApi } from '../../services/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Activity,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    Database,
    Shield,
    RefreshCw,
    History,
    Calendar,
    FileEdit,
    PlusCircle,
    Trash2,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
    id: number;
    userId: number;
    action: string;
    tableName: string;
    recordId: number;
    oldValue: any;
    newValue: any;
    ipAddress: string | null;
    timestamp: string;
    user: {
        fullname: string;
        role: string;
    };
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);
    const [filters, setFilters] = useState({
        tableName: '',
        action: '',
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditApi.getAll({
                ...filters,
                limit,
                offset: page * limit
            });
            setLogs(response.data.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Gagal mengambil data log audit');
        } finally {
            setLoading(false);
        }
    }, [page, filters, limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionBadgeClass = (action: string) => {
        switch (action) {
            case 'CREATE': return 'badge-success';
            case 'UPDATE': return 'badge-warning';
            case 'DELETE': return 'badge-error';
            case 'LOGIN': return 'badge-info';
            default: return 'badge-muted';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <PlusCircle size={14} />;
            case 'UPDATE': return <FileEdit size={14} />;
            case 'DELETE': return <Trash2 size={14} />;
            case 'LOGIN': return <History size={14} />;
            default: return <Activity size={14} />;
        }
    };

    const parseJson = (data: any) => {
        if (!data || data === 'null' || data === '{}') return null;
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
            return data;
        }
    };

    const renderFullJson = (data: any) => {
        const parsed = parseJson(data);
        if (!parsed) return <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>Data Kosong</div>;

        return (
            <div style={{
                background: 'var(--bg-elevated)',
                padding: '16px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid var(--border-color)'
            }}>
                <pre>{JSON.stringify(parsed, null, 2)}</pre>
            </div>
        );
    };

    return (
        <div className="page-content">
            {/* Header */}
            <div className="page-header page-header-responsive">
                <div className="page-header-content">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield color="var(--primary)" size={32} />
                        Log Audit Sistem
                    </h1>
                    <p>Pantau seluruh aktivitas pengguna dan perubahan data sensitif.</p>
                </div>
                <div className="page-header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => fetchLogs()}
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ marginRight: '8px' }} />
                        Segarkan Data
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-4 mb-6" style={{ gap: '16px' }}>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Aktivitas</span>
                        <Activity className="stat-card-icon" size={20} />
                    </div>
                    <div className="stat-card-value font-mono">{logs.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Aksi Terakhir</span>
                        <History className="stat-card-icon" size={20} />
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.1rem', wordBreak: 'break-all' }}>
                        {logs.length > 0 ? (
                            <span className={`badge ${getActionBadgeClass(logs[0].action)}`}>
                                {logs[0].action}
                            </span>
                        ) : '-'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Tabel Teraktif</span>
                        <Database className="stat-card-icon" size={20} />
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1rem', fontWeight: '700' }}>
                        {logs.length > 0 ? logs[0].tableName : '-'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Keamanan Audit</span>
                        <Shield className="stat-card-icon" size={20} />
                    </div>
                    <div className="stat-card-value font-mono" style={{ color: 'var(--success)' }}>100%</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6" style={{ padding: '24px' }}>
                <div className="grid grid-2" style={{ gap: '20px' }}>
                    <div className="input-icon-wrapper w-full">
                        <Search className="input-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan nama tabel..."
                            className="form-input"
                            value={filters.tableName}
                            onChange={(e) => setFilters(f => ({ ...f, tableName: e.target.value }))}
                        />
                    </div>
                    <div className="input-icon-wrapper w-full">
                        <Filter className="input-icon" size={18} />
                        <select
                            className="form-input form-select"
                            style={{ paddingLeft: '40px' }}
                            value={filters.action}
                            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                        >
                            <option value="">Semua Tipe Aktivitas</option>
                            <option value="CREATE">PENAMBAHAN DATA</option>
                            <option value="UPDATE">PERUBAHAN DATA</option>
                            <option value="DELETE">PENGHAPUSAN DATA</option>
                            <option value="LOGIN">LOGIN PENGGUNA</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Waktu & Pengguna</th>
                                <th>Aktivitas</th>
                                <th>Tabel & ID Objek</th>
                                <th style={{ textAlign: 'right' }}>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px' }}>
                                        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--primary)' }} />
                                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Menghubungkan ke server audit...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px' }}>
                                        <div style={{ opacity: 0.5, marginBottom: '12px' }}>
                                            <Activity size={48} style={{ margin: '0 auto' }} />
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada jejak aktivitas yang tercatat sesuai kriteria pencarian Anda.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '38px', height: '38px', borderRadius: '10px',
                                                    background: 'var(--primary-light)', color: 'white',
                                                    display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontWeight: '800',
                                                    fontSize: '1rem', flexShrink: 0
                                                }}>
                                                    {log.user.fullname.charAt(0)}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {log.user.fullname}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={12} />
                                                        {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ padding: '6px 10px' }}>
                                                {getActionIcon(log.action)}
                                                <span style={{ marginLeft: '6px', fontWeight: '600' }}>{log.action}</span>
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{log.tableName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: #{log.recordId}</div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setSelectedLog(log)}
                                                title="Lihat Detail Transaksi"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '32px', paddingBottom: '32px'
            }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Menampilkan <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{logs.length}</span> aktivitas terbaru
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === 0 || loading}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{
                        padding: '0 12px', height: '32px', display: 'flex',
                        alignItems: 'center', background: 'var(--bg-card)',
                        borderRadius: '8px', border: '1px solid var(--border-color)',
                        fontWeight: '700', fontSize: '0.875rem'
                    }}>
                        {page + 1}
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={logs.length < limit || loading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal" style={{ maxWidth: '900px', width: '95%', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '24px 32px', borderBottom: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--bg-card)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'var(--primary-light)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <History size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '800' }}>Detail Jejak Audit</h3>
                                    <p style={{ margin: '0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID Transaksi: #{selectedLog.id}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLog(null)} style={{ padding: '8px' }}>
                                <ArrowRight className="rotate-45" size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <div style={{ padding: '32px', overflowY: 'auto', maxHeight: '70vh', background: 'var(--bg-body)' }}>
                            <div className="grid grid-2 mb-8" style={{ gap: '24px' }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: '700', marginBottom: '12px', display: 'block' }}>Data Sebelumnya</label>
                                    {renderFullJson(selectedLog.oldValue)}
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontWeight: '700', marginBottom: '12px', display: 'block' }}>Data Setelah Perubahan</label>
                                    {renderFullJson(selectedLog.newValue)}
                                </div>
                            </div>

                            <div className="card" style={{ padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                                <div className="grid grid-3" style={{ gap: '24px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Eksekutor Sistem</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary)' }}>
                                                {selectedLog.user.fullname.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedLog.user.fullname}</div>
                                                <div className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{selectedLog.user.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Objek Terdampak</div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedLog.tableName}</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>ID Record: #{selectedLog.recordId}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Metadata Akses</div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{selectedLog.ipAddress || 'Internal Call'}</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Shield size={12} />
                                            Verified Audit Log
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
                            <button onClick={() => setSelectedLog(null)} className="btn btn-primary px-10 py-3" style={{ borderRadius: '12px', fontWeight: '700' }}>
                                Mengerti & Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
