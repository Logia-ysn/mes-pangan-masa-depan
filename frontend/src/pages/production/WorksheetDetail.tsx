import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { worksheetApi, machineApi, employeeApi } from '../../services/api';
import ProductionProgress from '../../components/Production/ProductionProgress';
import type { ProductionStep } from '../../components/Production/ProductionProgress';
import { printPage } from '../../utils/printUtils';
import { logger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Status config
const statusConfig: { [key: string]: { label: string; color: string; bg: string; icon: string } } = {
    DRAFT: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6', icon: 'draft' },
    SUBMITTED: { label: 'Menunggu Approval', color: '#1d4ed8', bg: '#dbeafe', icon: 'pending_actions' },
    COMPLETED: { label: 'Selesai & Approved', color: '#15803d', bg: '#dcfce7', icon: 'check_circle' },
    REJECTED: { label: 'Ditolak', color: '#b91c1c', bg: '#fee2e2', icon: 'cancel' },
    CANCELLED: { label: 'Dibatalkan', color: '#374151', bg: '#e5e7eb', icon: 'block' },
};

const SUPERVISOR_ROLES = ['SUPERVISOR', 'MANAGER', 'ADMIN', 'SUPERUSER', 'DIRECTOR', 'BOD'];
const MANAGER_ROLES = ['MANAGER', 'ADMIN', 'SUPERUSER', 'DIRECTOR', 'BOD'];

interface Worksheet {
    id: number;
    worksheet_date: string;
    shift: string;
    status: string;
    gabah_input: number;
    beras_output: number;
    menir_output: number;
    dedak_output: number;
    sekam_output: number;
    machine_hours: number;
    downtime_hours: number;
    downtime_reason: string;
    notes: string;
    process_steps?: string;
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    rejection_reason?: string;
    submitted_at?: string;
    approved_at?: string;
    rejected_at?: string;
    completed_at?: string;
    id_user?: number;
    // Relations
    otm_id_machine?: { id: number; name: string };
    otm_id_user?: { id: number; fullname: string; email: string };
    SubmittedByUser?: { id: number; fullname: string };
    ApprovedByUser?: { id: number; fullname: string };
    RejectedByUser?: { id: number; fullname: string };
    input_batches?: any[];
    WorksheetInputBatch?: any[];
    WorksheetSideProduct?: any[];
    id_machines?: string;
    id_operators?: string;
}

const WorksheetDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
    const [machines, setMachines] = useState<{ id: number; name: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: number; fullname: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');

    const getProductionSteps = (): ProductionStep[] => {
        if (!worksheet?.process_steps) return [];
        try {
            const steps = JSON.parse(worksheet.process_steps) as string[];
            return steps.map((step, index) => ({
                id: String(index + 1),
                label: step,
                status: 'completed',
                icon: 'settings_suggest',
                date: formatDate(worksheet.worksheet_date),
            }));
        } catch (e) {
            logger.error('Failed to parse process steps', e);
            return [];
        }
    };

    const productionSteps = getProductionSteps();

    useEffect(() => {
        if (id) fetchWorksheet(parseInt(id));
    }, [id]);

    const fetchWorksheet = async (wsId: number) => {
        try {
            const [wsRes, machRes, empRes] = await Promise.all([
                worksheetApi.getById(wsId),
                machineApi.getAll().catch(() => ({ data: { data: [] } })),
                employeeApi.getAll().catch(() => ({ data: { data: [] } }))
            ]);
            setWorksheet(wsRes.data.data || wsRes.data);
            setMachines(machRes.data?.data || machRes.data || []);
            setEmployees(empRes.data?.data || empRes.data || []);
        } catch (err) {
            logger.error('Error:', err);
            setError('Gagal memuat data worksheet');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!worksheet || !window.confirm('Submit worksheet ini untuk approval?')) return;
        setActionLoading(true);
        try {
            await worksheetApi.submit(worksheet.id);
            showSuccess('Berhasil', 'Worksheet berhasil disubmit untuk approval');
            fetchWorksheet(worksheet.id);
        } catch (e: any) {
            showError('Gagal', e?.response?.data?.error?.message || 'Gagal submit worksheet');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!worksheet || !window.confirm('Approve worksheet ini? Stok akan langsung bergerak.')) return;
        setActionLoading(true);
        try {
            await worksheetApi.approve(worksheet.id);
            showSuccess('Berhasil', 'Worksheet berhasil di-approve! Stok telah diperbarui.');
            fetchWorksheet(worksheet.id);
        } catch (e: any) {
            showError('Gagal', e?.response?.data?.error?.message || 'Gagal approve worksheet');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!worksheet || !rejectReason.trim()) {
            showError('Validasi', 'Alasan penolakan wajib diisi');
            return;
        }
        setActionLoading(true);
        try {
            await worksheetApi.reject(worksheet.id, rejectReason);
            showSuccess('Berhasil', 'Worksheet telah ditolak');
            setShowRejectDialog(false);
            setRejectReason('');
            fetchWorksheet(worksheet.id);
        } catch (e: any) {
            showError('Gagal', e?.response?.data?.error?.message || 'Gagal reject worksheet');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!worksheet) return;
        setActionLoading(true);
        try {
            await worksheetApi.cancel(worksheet.id, cancelReason);
            showSuccess('Berhasil', 'Worksheet berhasil dibatalkan');
            setShowCancelDialog(false);
            setCancelReason('');
            fetchWorksheet(worksheet.id);
        } catch (e: any) {
            showError('Gagal', e?.response?.data?.error?.message || 'Gagal cancel worksheet');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!worksheet) return;
        if (!['DRAFT', 'REJECTED', 'CANCELLED'].includes(worksheet.status)) {
            showError('Tidak Bisa', 'Hanya worksheet DRAFT/REJECTED/CANCELLED yang bisa dihapus');
            return;
        }
        if (!window.confirm('Hapus worksheet ini permanen?')) return;
        try {
            await worksheetApi.delete(worksheet.id);
            showSuccess('Berhasil', 'Worksheet dihapus');
            navigate('/production/worksheets');
        } catch (e: any) {
            showError('Gagal', e?.response?.data?.error?.message || 'Gagal menghapus');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    };
    const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);
    const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

    const userRole = user?.role || '';
    const isOwner = user?.id === worksheet?.id_user;
    const isSupervisor = SUPERVISOR_ROLES.includes(userRole);
    const isManager = MANAGER_ROLES.includes(userRole);

    if (loading) return (
        <div className="page-content">
            <div className="empty-state">
                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                <h3>Memuat data...</h3>
            </div>
        </div>
    );

    if (error || !worksheet) return (
        <div className="page-content">
            <div className="empty-state">
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
                <h3>{error || 'Data tidak ditemukan'}</h3>
                <button className="btn btn-primary" onClick={() => navigate('/production/worksheets')} style={{ marginTop: 16 }}>
                    Kembali ke Daftar
                </button>
            </div>
        </div>
    );

    const rendemen = worksheet.gabah_input > 0
        ? ((worksheet.beras_output / worksheet.gabah_input) * 100).toFixed(2)
        : '0';

    const statusCfg = statusConfig[worksheet.status] || statusConfig.DRAFT;
    const inputBatches = worksheet.WorksheetInputBatch || worksheet.input_batches || [];

    return (
        <>
            <div className="page-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/production/worksheets')}>
                        <span className="material-symbols-outlined icon-sm">arrow_back</span>
                        Kembali
                    </button>

                    {/* Action Buttons by Status & Role */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* DRAFT: Owner can submit */}
                        {worksheet.status === 'DRAFT' && isOwner && (
                            <button
                                id="btn-submit-worksheet"
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={actionLoading}
                            >
                                <span className="material-symbols-outlined icon-sm">send</span>
                                Submit untuk Approval
                            </button>
                        )}
                        {/* DRAFT/REJECTED: Owner can edit */}
                        {['DRAFT', 'REJECTED'].includes(worksheet.status) && isOwner && (
                            <button
                                id="btn-edit-worksheet"
                                className="btn btn-secondary"
                                onClick={() => navigate(`/production/worksheets/${worksheet.id}/edit`)}
                            >
                                <span className="material-symbols-outlined icon-sm">edit</span>
                                Edit
                            </button>
                        )}
                        {/* SUBMITTED: Supervisor can approve/reject */}
                        {worksheet.status === 'SUBMITTED' && isSupervisor && (
                            <>
                                <button
                                    id="btn-approve-worksheet"
                                    className="btn btn-success"
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    style={{ background: '#16a34a', color: '#fff' }}
                                >
                                    <span className="material-symbols-outlined icon-sm">check_circle</span>
                                    Approve
                                </button>
                                <button
                                    id="btn-reject-worksheet"
                                    className="btn btn-danger"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={actionLoading}
                                    style={{ background: '#dc2626', color: '#fff' }}
                                >
                                    <span className="material-symbols-outlined icon-sm">cancel</span>
                                    Tolak
                                </button>
                            </>
                        )}
                        {/* DRAFT/SUBMITTED/COMPLETED: Manager can cancel */}
                        {['DRAFT', 'SUBMITTED', 'COMPLETED'].includes(worksheet.status) && isManager && (
                            <button
                                id="btn-cancel-worksheet"
                                className="btn btn-secondary"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={actionLoading}
                                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                            >
                                <span className="material-symbols-outlined icon-sm">block</span>
                                Cancel
                            </button>
                        )}
                        {/* DRAFT/REJECTED/CANCELLED: Delete */}
                        {['DRAFT', 'REJECTED', 'CANCELLED'].includes(worksheet.status) && (isOwner || isManager) && (
                            <button
                                id="btn-delete-worksheet"
                                className="btn btn-secondary"
                                onClick={handleDelete}
                                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                            >
                                <span className="material-symbols-outlined icon-sm">delete</span>
                                Hapus
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={printPage}>
                            <span className="material-symbols-outlined icon-sm">print</span>
                            Print
                        </button>
                    </div>
                </div>

                {/* Status Banner */}
                <div style={{
                    background: statusCfg.bg,
                    border: `1px solid ${statusCfg.color}33`,
                    borderRadius: 10,
                    padding: '14px 20px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap'
                }}>
                    <span className="material-symbols-outlined" style={{ color: statusCfg.color, fontSize: 28 }}>
                        {statusCfg.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: statusCfg.color, fontSize: '1.05rem' }}>{statusCfg.label}</div>
                        {worksheet.status === 'DRAFT' && (
                            <div style={{ fontSize: '0.84rem', color: '#6b7280', marginTop: 2 }}>
                                Worksheet belum disubmit. Stok belum bergerak.
                            </div>
                        )}
                        {worksheet.status === 'SUBMITTED' && (
                            <div style={{ fontSize: '0.84rem', color: '#1d4ed8', marginTop: 2 }}>
                                Disubmit oleh <strong>{worksheet.SubmittedByUser?.fullname || '-'}</strong> pada {formatDateTime(worksheet.submitted_at)}. Menunggu approval supervisor.
                            </div>
                        )}
                        {worksheet.status === 'COMPLETED' && (
                            <div style={{ fontSize: '0.84rem', color: '#15803d', marginTop: 2 }}>
                                Disetujui oleh <strong>{worksheet.ApprovedByUser?.fullname || '-'}</strong> pada {formatDateTime(worksheet.approved_at)}. Stok telah diperbarui.
                            </div>
                        )}
                        {worksheet.status === 'REJECTED' && (
                            <div style={{ fontSize: '0.84rem', color: '#b91c1c', marginTop: 2 }}>
                                Ditolak oleh <strong>{worksheet.RejectedByUser?.fullname || '-'}</strong> pada {formatDateTime(worksheet.rejected_at)}.
                                {worksheet.rejection_reason && (
                                    <span> Alasan: <strong>{worksheet.rejection_reason}</strong></span>
                                )}
                            </div>
                        )}
                        {worksheet.status === 'CANCELLED' && (
                            <div style={{ fontSize: '0.84rem', color: '#374151', marginTop: 2 }}>
                                Worksheet telah dibatalkan.
                            </div>
                        )}
                    </div>
                </div>

                {/* REJECTED: Resubmit hint */}
                {worksheet.status === 'REJECTED' && isOwner && (
                    <div style={{
                        background: '#fff7ed', border: '1px solid #fb923c', borderRadius: 8,
                        padding: '10px 16px', marginBottom: 16, color: '#c2410c', fontSize: '0.87rem'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>info</span>
                        Edit worksheet dan submit ulang setelah memperbaiki masalah.
                    </div>
                )}

                {/* Production Flow */}
                <ProductionProgress steps={productionSteps} />

                <div className="grid grid-2-1">
                    {/* Main Info */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header">
                            <h3 className="card-title">Informasi Produksi</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div className="badge badge-info">{worksheet.shift}</div>
                                {worksheet.batch_code && <div className="badge badge-success">{worksheet.batch_code}</div>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, padding: 24 }}>
                            <div>
                                <label className="text-secondary text-sm">Tanggal</label>
                                <div className="text-lg font-medium">{formatDate(worksheet.worksheet_date)}</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Mesin / Unit</label>
                                <div className="text-lg font-medium">
                                    {worksheet.id_machines ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                            {(() => {
                                                try {
                                                    const ids = JSON.parse(worksheet.id_machines) as number[];
                                                    if (!Array.isArray(ids) || ids.length === 0) return worksheet.otm_id_machine?.name || '-';
                                                    return ids.map(mid => {
                                                        const m = machines.find(m => m.id === mid);
                                                        return (
                                                            <span key={mid} className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px' }}>
                                                                {m ? m.name : `Mesin #${mid}`}
                                                            </span>
                                                        );
                                                    });
                                                } catch { return worksheet.otm_id_machine?.name || '-'; }
                                            })()}
                                        </div>
                                    ) : (worksheet.otm_id_machine?.name || '-')}
                                </div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Operator</label>
                                <div className="text-lg font-medium">
                                    {worksheet.id_operators ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                            {(() => {
                                                try {
                                                    const ids = JSON.parse(worksheet.id_operators) as number[];
                                                    if (!Array.isArray(ids) || ids.length === 0) return worksheet.otm_id_user?.fullname || '-';
                                                    return ids.map(eid => {
                                                        const emp = employees.find(e => e.id === eid);
                                                        return (
                                                            <span key={eid} className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px' }}>
                                                                {emp ? emp.fullname : `Operator #${eid}`}
                                                            </span>
                                                        );
                                                    });
                                                } catch { return worksheet.otm_id_user?.fullname || '-'; }
                                            })()}
                                        </div>
                                    ) : (worksheet.otm_id_user?.fullname || '-')}
                                </div>
                            </div>

                            <hr style={{ gridColumn: '1 / -1', borderColor: 'var(--border-color)', margin: 0 }} />

                            <div>
                                <label className="text-secondary text-sm">Input Gabah (kg)</label>
                                <div className="text-xl font-bold font-mono">{formatNumber(worksheet.gabah_input)}</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Output Beras (kg)</label>
                                <div className="text-xl font-bold font-mono text-success">{formatNumber(worksheet.beras_output)}</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Rendemen</label>
                                <div className="text-xl font-bold font-mono text-primary">{rendemen}%</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Jam Mesin</label>
                                <div className="text-lg font-mono">{worksheet.machine_hours} Jam</div>
                            </div>
                        </div>
                    </div>

                    {/* Input Batches */}
                    {inputBatches.length > 0 && (
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3 className="card-title">Batch Input Bahan Baku</h3>
                                {['DRAFT', 'SUBMITTED'].includes(worksheet.status) && (
                                    <span style={{ fontSize: '0.78rem', color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: 6 }}>
                                        Stok belum bergerak
                                    </span>
                                )}
                            </div>
                            <div className="table-container" style={{ padding: 0 }}>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="text-left">Tipe Produk</th>
                                            <th className="text-left">Kode Batch</th>
                                            <th className="text-right">Qty (Kg)</th>
                                            <th className="hide-mobile text-right">Harga/Kg</th>
                                            <th className="hide-mobile text-right">Total Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inputBatches.map((batch: any, idx: number) => (
                                            <tr key={idx}>
                                                <td>{batch.Stock?.ProductType?.name || batch.otm_id_stock?.otm_id_product_type?.name || '-'}</td>
                                                <td className="font-mono">{batch.batch_code || batch.otm_id_stock?.batch_code || '-'}</td>
                                                <td className="text-right">{formatNumber(batch.quantity)}</td>
                                                <td className="hide-mobile text-right">{formatCurrency(batch.unit_price || 0)}</td>
                                                <td className="hide-mobile text-right">{formatCurrency(batch.total_cost || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* HPP — only show for COMPLETED */}
                    {worksheet.status === 'COMPLETED' && worksheet.hpp !== undefined && (
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3 className="card-title">Analisis Biaya (HPP)</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, padding: 24 }}>
                                <div>
                                    <label className="text-secondary text-sm">Biaya Bahan Baku</label>
                                    <div className="text-lg font-medium font-mono text-error">{formatCurrency(worksheet.raw_material_cost || 0)}</div>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">Pendapatan Sampingan</label>
                                    <div className="text-lg font-medium font-mono text-success">{formatCurrency(worksheet.side_product_revenue || 0)}</div>
                                    <small className="text-secondary">(Dikurangkan)</small>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">Total HPP</label>
                                    <div className="text-xl font-bold font-mono">{formatCurrency(worksheet.hpp || 0)}</div>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">HPP / Kg</label>
                                    <div className="text-xl font-bold font-mono text-primary">{formatCurrency(worksheet.hpp_per_kg || 0)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Byproducts & Downtime */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header">
                            <h3 className="card-title">Detail Lainnya</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px 16px' }}>
                            <div>
                                <h4 className="text-sm font-bold mb-2">Hasil Samping</h4>
                                <table style={{ width: '100%' }}>
                                    <tbody>
                                        <tr><td className="text-secondary">Menir</td><td className="font-mono text-right">{formatNumber(worksheet.menir_output)} kg</td></tr>
                                        <tr><td className="text-secondary">Dedak</td><td className="font-mono text-right">{formatNumber(worksheet.dedak_output)} kg</td></tr>
                                        <tr><td className="text-secondary">Sekam</td><td className="font-mono text-right">{formatNumber(worksheet.sekam_output)} kg</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold mb-2">Downtime</h4>
                                {(worksheet.downtime_hours > 0 || worksheet.downtime_reason) ? (
                                    <div style={{ padding: 12, border: '1px solid var(--error)', borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.05)' }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-error font-medium">Terjadi Downtime</span>
                                            <span className="badge badge-error">{worksheet.downtime_hours} Jam</span>
                                        </div>
                                        <p className="text-secondary text-sm">{worksheet.downtime_reason || 'Tidak ada alasan'}</p>
                                    </div>
                                ) : (
                                    <div className="text-secondary italic">Tidak ada downtime</div>
                                )}
                            </div>
                        </div>

                        {worksheet.notes && (
                            <div style={{ padding: '0 16px 16px' }}>
                                <h4 className="text-sm font-bold mb-2">Catatan</h4>
                                <p className="text-secondary">{worksheet.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 8px', color: '#b91c1c' }}>Tolak Worksheet</h3>
                        <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Masukkan alasan penolakan. Operator akan bisa melihat alasan ini dan memperbaiki worksheet.
                        </p>
                        <textarea
                            id="reject-reason-input"
                            className="form-input"
                            style={{ width: '100%', minHeight: 100, resize: 'vertical', marginBottom: 16 }}
                            placeholder="Contoh: Data input tidak sesuai, perlu konfirmasi ulang dengan gudang..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>Batal</button>
                            <button
                                id="btn-confirm-reject"
                                className="btn"
                                style={{ background: '#dc2626', color: '#fff' }}
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                            >
                                {actionLoading ? 'Memproses...' : 'Tolak Worksheet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Dialog */}
            {showCancelDialog && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 8px' }}>Batalkan Worksheet</h3>
                        {worksheet.status === 'COMPLETED' && (
                            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.85rem', color: '#b91c1c' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>warning</span>
                                Worksheet sudah COMPLETED. Membatalkan akan me-reversal stok yang sudah bergerak.
                            </div>
                        )}
                        <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                            Masukkan alasan pembatalan (opsional):
                        </p>
                        <textarea
                            id="cancel-reason-input"
                            className="form-input"
                            style={{ width: '100%', minHeight: 80, resize: 'vertical', marginBottom: 16 }}
                            placeholder="Alasan pembatalan..."
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}>Tutup</button>
                            <button
                                id="btn-confirm-cancel"
                                className="btn"
                                style={{ background: '#374151', color: '#fff' }}
                                onClick={handleCancel}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Memproses...' : 'Ya, Batalkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WorksheetDetail;
