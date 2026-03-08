import { useState, useEffect } from 'react';
import api from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';

interface WorkOrder {
    id: number;
    id_factory: number;
    work_order_number: string;
    title: string;
    description?: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    id_production_line?: number;
    planned_start?: string;
    planned_end?: string;
    actual_start?: string;
    actual_end?: string;
    target_quantity?: number;
    actual_quantity?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    User?: { id: number; name: string };
    ProductionLine?: { id: number; code: string; name: string };
    _count?: { Worksheet: number };
}

interface ProductionLine {
    id: number;
    code: string;
    name: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
    PLANNED: { label: 'Direncanakan', className: 'badge-info', icon: 'event_note' },
    IN_PROGRESS: { label: 'Berjalan', className: 'badge-warning', icon: 'play_circle' },
    COMPLETED: { label: 'Selesai', className: 'badge-success', icon: 'check_circle' },
    CANCELLED: { label: 'Dibatalkan', className: 'badge-error', icon: 'cancel' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Rendah', color: 'var(--text-muted)' },
    NORMAL: { label: 'Normal', color: 'var(--primary)' },
    HIGH: { label: 'Tinggi', color: 'var(--warning)' },
    URGENT: { label: 'Darurat', color: 'var(--error)' },
};

const WorkOrders = () => {
    const { selectedFactory } = useFactory();
    const { showSuccess, showError } = useToast();

    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [prodLines, setProdLines] = useState<ProductionLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const limit = 20;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'NORMAL',
        id_production_line: '',
        planned_start: '',
        planned_end: '',
        target_quantity: '',
        notes: '',
    });

    useEffect(() => { fetchOrders(); }, [selectedFactory, page, statusFilter]);
    useEffect(() => { if (selectedFactory) fetchProdLines(); }, [selectedFactory]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params: any = { limit, offset: (page - 1) * limit };
            if (selectedFactory) params.id_factory = selectedFactory;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/work-orders', { params });
            setOrders(res.data.data);
            setTotal(res.data.total);
        } catch (err: any) {
            logger.error('Failed to fetch work orders', err);
            showError('Error', 'Gagal memuat work orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchProdLines = async () => {
        try {
            const res = await api.get('/production-lines', { params: { limit: 100, id_factory: selectedFactory } });
            setProdLines(res.data.data || []);
        } catch (err) {
            logger.error('Failed to fetch production lines', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                title: formData.title,
                description: formData.description || undefined,
                priority: formData.priority,
                id_production_line: formData.id_production_line ? Number(formData.id_production_line) : undefined,
                planned_start: formData.planned_start || undefined,
                planned_end: formData.planned_end || undefined,
                target_quantity: formData.target_quantity ? Number(formData.target_quantity) : undefined,
                notes: formData.notes || undefined,
            };

            if (editingOrder) {
                await api.put(`/work-orders/${editingOrder.id}`, payload);
                showSuccess('Berhasil', 'Work Order berhasil diperbarui');
            } else {
                await api.post('/work-orders', payload);
                showSuccess('Berhasil', 'Work Order berhasil dibuat');
            }
            closeModal();
            fetchOrders();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menyimpan Work Order');
        }
    };

    const handleWorkflow = async (id: number, action: string, extra?: any) => {
        try {
            await api.post(`/work-orders/${id}/workflow`, { action, ...extra });
            const msgs: Record<string, string> = {
                start: 'Work Order dimulai',
                complete: 'Work Order selesai',
                cancel: 'Work Order dibatalkan',
            };
            showSuccess('Berhasil', msgs[action] || 'Aksi berhasil');
            fetchOrders();
            if (selectedOrder?.id === id) {
                const res = await api.get(`/work-orders/${id}`);
                setSelectedOrder(res.data.data);
            }
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menjalankan aksi');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus Work Order ini?')) return;
        try {
            await api.delete(`/work-orders/${id}`);
            showSuccess('Berhasil', 'Work Order berhasil dihapus');
            fetchOrders();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menghapus Work Order');
        }
    };

    const openDetail = async (wo: WorkOrder) => {
        try {
            const res = await api.get(`/work-orders/${wo.id}`);
            setSelectedOrder(res.data.data);
            setIsDetailOpen(true);
        } catch (err) {
            showError('Error', 'Gagal memuat detail');
        }
    };

    const openModal = (wo?: WorkOrder) => {
        if (wo) {
            setEditingOrder(wo);
            setFormData({
                title: wo.title,
                description: wo.description || '',
                priority: wo.priority,
                id_production_line: wo.id_production_line ? String(wo.id_production_line) : '',
                planned_start: wo.planned_start ? wo.planned_start.slice(0, 16) : '',
                planned_end: wo.planned_end ? wo.planned_end.slice(0, 16) : '',
                target_quantity: wo.target_quantity ? String(wo.target_quantity) : '',
                notes: wo.notes || '',
            });
        } else {
            setEditingOrder(null);
            setFormData({ title: '', description: '', priority: 'NORMAL', id_production_line: '', planned_start: '', planned_end: '', target_quantity: '', notes: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingOrder(null); };

    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const fmtDateTime = (d?: string) => d ? new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <span className="material-symbols-outlined" style={{ fontSize: 28, marginRight: 8 }}>assignment</span>
                        Work Orders
                    </h1>
                    <p className="page-subtitle">Kelola perintah kerja produksi</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select className="form-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Semua Status</option>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => openModal()} disabled={!selectedFactory}>
                        <span className="material-symbols-outlined">add</span>
                        Buat Work Order
                    </button>
                </div>
            </div>

            {!selectedFactory && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    <span className="material-symbols-outlined">info</span>
                    Pilih pabrik terlebih dahulu.
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="loading-container"><div className="loading-spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-muted)' }}>assignment</span>
                    <h3>Belum ada Work Order</h3>
                    <p>Klik "Buat Work Order" untuk membuat perintah kerja baru.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. WO</th>
                                <th>Judul</th>
                                <th>Prioritas</th>
                                <th>Status</th>
                                <th>Lini Produksi</th>
                                <th>Target (kg)</th>
                                <th>Worksheet</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(wo => {
                                const sc = STATUS_CONFIG[wo.status];
                                const pc = PRIORITY_CONFIG[wo.priority];
                                return (
                                    <tr key={wo.id}>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
                                                onClick={() => openDetail(wo)}>
                                                {wo.work_order_number}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.title}</td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: pc.color, fontWeight: 600, fontSize: 13 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                                                {pc.label}
                                            </span>
                                        </td>
                                        <td><span className={`badge ${sc.className}`}>{sc.label}</span></td>
                                        <td>{wo.ProductionLine?.name || '-'}</td>
                                        <td>{wo.target_quantity ? Number(wo.target_quantity).toLocaleString('id-ID') : '-'}</td>
                                        <td>{wo._count?.Worksheet || 0}</td>
                                        <td style={{ fontSize: 12 }}>{fmtDate(wo.created_at)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {wo.status === 'PLANNED' && (
                                                    <>
                                                        <button className="btn btn-ghost btn-sm" title="Mulai" onClick={() => handleWorkflow(wo.id, 'start')}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--success)' }}>play_arrow</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openModal(wo)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" title="Hapus" onClick={() => handleDelete(wo.id)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)' }}>delete</span>
                                                        </button>
                                                    </>
                                                )}
                                                {wo.status === 'IN_PROGRESS' && (
                                                    <>
                                                        <button className="btn btn-ghost btn-sm" title="Selesai" onClick={() => handleWorkflow(wo.id, 'complete')}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--success)' }}>check_circle</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" title="Batalkan" onClick={() => handleWorkflow(wo.id, 'cancel')}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)' }}>cancel</span>
                                                        </button>
                                                    </>
                                                )}
                                                {wo.status === 'CANCELLED' && (
                                                    <button className="btn btn-ghost btn-sm" title="Hapus" onClick={() => handleDelete(wo.id)}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)' }}>delete</span>
                                                    </button>
                                                )}
                                                <button className="btn btn-ghost btn-sm" title="Detail" onClick={() => openDetail(wo)}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {total > limit && (
                <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
                        <div className="modal-header">
                            <h2>{editingOrder ? 'Edit Work Order' : 'Buat Work Order'}</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Judul *</label>
                                    <input id="input-wo-title" className="form-input" value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })} required
                                        placeholder="Contoh: Produksi Beras Premium Batch Maret" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deskripsi</label>
                                    <textarea id="input-wo-desc" className="form-input" value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
                                        placeholder="Keterangan work order" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Prioritas</label>
                                        <select id="select-wo-priority" className="form-input" value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Lini Produksi</label>
                                        <select id="select-wo-line" className="form-input" value={formData.id_production_line}
                                            onChange={e => setFormData({ ...formData, id_production_line: e.target.value })}>
                                            <option value="">-- Pilih --</option>
                                            {prodLines.map(pl => (
                                                <option key={pl.id} value={pl.id}>{pl.name} ({pl.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Rencana Mulai</label>
                                        <input id="input-wo-start" className="form-input" type="datetime-local"
                                            value={formData.planned_start}
                                            onChange={e => setFormData({ ...formData, planned_start: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Rencana Selesai</label>
                                        <input id="input-wo-end" className="form-input" type="datetime-local"
                                            value={formData.planned_end}
                                            onChange={e => setFormData({ ...formData, planned_end: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Kuantitas (kg)</label>
                                    <input id="input-wo-qty" className="form-input" type="number" step="0.01"
                                        value={formData.target_quantity}
                                        onChange={e => setFormData({ ...formData, target_quantity: e.target.value })}
                                        placeholder="Contoh: 5000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Catatan</label>
                                    <textarea id="input-wo-notes" className="form-input" value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingOrder ? 'Simpan Perubahan' : 'Buat Work Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {isDetailOpen && selectedOrder && (
                <div className="modal-overlay" onClick={() => setIsDetailOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>Detail Work Order</h2>
                            <button className="btn btn-ghost" onClick={() => setIsDetailOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>No. WO</div>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedOrder.work_order_number}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                                    <span className={`badge ${STATUS_CONFIG[selectedOrder.status]?.className}`}>
                                        {STATUS_CONFIG[selectedOrder.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prioritas</div>
                                    <span style={{ color: PRIORITY_CONFIG[selectedOrder.priority]?.color, fontWeight: 600 }}>
                                        {PRIORITY_CONFIG[selectedOrder.priority]?.label}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lini Produksi</div>
                                    <div>{(selectedOrder as any).ProductionLine?.name || '-'}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Judul</div>
                                <div style={{ fontWeight: 600 }}>{selectedOrder.title}</div>
                                {selectedOrder.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedOrder.description}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rencana Mulai</div>
                                    <div>{fmtDateTime(selectedOrder.planned_start)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rencana Selesai</div>
                                    <div>{fmtDateTime(selectedOrder.planned_end)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aktual Mulai</div>
                                    <div>{fmtDateTime(selectedOrder.actual_start)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aktual Selesai</div>
                                    <div>{fmtDateTime(selectedOrder.actual_end)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Kuantitas</div>
                                    <div>{selectedOrder.target_quantity ? `${Number(selectedOrder.target_quantity).toLocaleString('id-ID')} kg` : '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kuantitas Aktual</div>
                                    <div>{selectedOrder.actual_quantity ? `${Number(selectedOrder.actual_quantity).toLocaleString('id-ID')} kg` : '-'}</div>
                                </div>
                            </div>

                            {/* Worksheets */}
                            {(selectedOrder as any).Worksheet && (selectedOrder as any).Worksheet.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                                        Worksheet terkait ({(selectedOrder as any).Worksheet.length})
                                    </div>
                                    {(selectedOrder as any).Worksheet.map((ws: any) => (
                                        <div key={ws.id} style={{
                                            padding: '8px 12px', borderRadius: 6, background: 'var(--bg-secondary)',
                                            marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 13
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{ws.batch_code || `WS-${ws.id}`}</span>
                                                {ws.step_number && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>Step {ws.step_number}</span>}
                                            </div>
                                            <span className={`badge ${STATUS_CONFIG[ws.status]?.className || 'badge-info'}`} style={{ fontSize: 11 }}>
                                                {ws.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedOrder.notes && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catatan</div>
                                    <div style={{ fontSize: 13 }}>{selectedOrder.notes}</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {selectedOrder.status === 'PLANNED' && (
                                <button className="btn btn-primary" onClick={() => { handleWorkflow(selectedOrder.id, 'start'); }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                                    Mulai
                                </button>
                            )}
                            {selectedOrder.status === 'IN_PROGRESS' && (
                                <>
                                    <button className="btn btn-primary" onClick={() => { handleWorkflow(selectedOrder.id, 'complete'); }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                                        Selesai
                                    </button>
                                    <button className="btn btn-outline" onClick={() => { handleWorkflow(selectedOrder.id, 'cancel'); }}>
                                        Batalkan
                                    </button>
                                </>
                            )}
                            <button className="btn btn-outline" onClick={() => setIsDetailOpen(false)}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrders;
