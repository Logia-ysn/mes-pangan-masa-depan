import { useState, useEffect } from 'react';
import api, { machineApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';

interface ProductionLine {
    id: number;
    id_factory: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    capacity_per_hour?: number;
    created_at: string;
    updated_at: string;
    Factory?: { id: number; name: string; code: string };
    Machine?: Machine[];
    _count?: { Machine: number; Worksheet: number };
}

interface Machine {
    id: number;
    code: string;
    name: string;
    machine_type?: string;
    capacity_per_hour?: number;
    status: string;
    sequence_order?: number;
    id_production_line?: number;
}

const ProductionLines = () => {
    const { selectedFactory } = useFactory();
    const { showSuccess, showError } = useToast();

    const [lines, setLines] = useState<ProductionLine[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
    const [selectedLine, setSelectedLine] = useState<ProductionLine | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 20;

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        capacity_per_hour: '',
    });

    const [assignForm, setAssignForm] = useState({
        id_machine: '',
        sequence_order: '',
    });

    useEffect(() => {
        fetchLines();
    }, [selectedFactory, page]);

    useEffect(() => {
        if (selectedFactory) fetchMachines();
    }, [selectedFactory]);

    const fetchLines = async () => {
        try {
            setLoading(true);
            const params: any = { limit, offset: (page - 1) * limit };
            if (selectedFactory) params.id_factory = selectedFactory;
            const res = await api.get('/production-lines', { params });
            setLines(res.data.data);
            setTotal(res.data.total);
        } catch (err: any) {
            logger.error('Failed to fetch production lines', err);
            showError('Error', 'Gagal memuat lini produksi');
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const params: any = { limit: 200 };
            if (selectedFactory) params.id_factory = selectedFactory;
            const res = await machineApi.getAll(params);
            setMachines(res.data.data || []);
        } catch (err) {
            logger.error('Failed to fetch machines', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                ...formData,
                id_factory: selectedFactory,
                capacity_per_hour: formData.capacity_per_hour ? Number(formData.capacity_per_hour) : undefined,
            };

            if (editingLine) {
                await api.put(`/production-lines/${editingLine.id}`, payload);
                showSuccess('Berhasil', 'Lini produksi berhasil diperbarui');
            } else {
                await api.post('/production-lines', payload);
                showSuccess('Berhasil', 'Lini produksi berhasil ditambahkan');
            }
            closeModal();
            fetchLines();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menyimpan lini produksi');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus lini produksi ini? Mesin akan dilepas dari lini ini.')) return;
        try {
            await api.delete(`/production-lines/${id}`);
            showSuccess('Berhasil', 'Lini produksi berhasil dihapus');
            fetchLines();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menghapus lini produksi');
        }
    };

    const handleToggleActive = async (line: ProductionLine) => {
        try {
            await api.put(`/production-lines/${line.id}`, { is_active: !line.is_active });
            showSuccess('Berhasil', `Lini produksi ${!line.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
            fetchLines();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal mengubah status');
        }
    };

    const handleAssignMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLine) return;
        try {
            await api.post(`/production-lines/${selectedLine.id}/machines`, {
                id_machine: Number(assignForm.id_machine),
                sequence_order: Number(assignForm.sequence_order),
            });
            showSuccess('Berhasil', 'Mesin berhasil ditambahkan ke lini');
            setIsAssignModalOpen(false);
            setAssignForm({ id_machine: '', sequence_order: '' });
            fetchLines();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal menambahkan mesin');
        }
    };

    const handleRemoveMachine = async (lineId: number, machineId: number) => {
        if (!confirm('Lepas mesin ini dari lini produksi?')) return;
        try {
            await api.delete(`/production-lines/${lineId}/machines/${machineId}`);
            showSuccess('Berhasil', 'Mesin berhasil dilepas dari lini');
            fetchLines();
        } catch (err: any) {
            showError('Gagal', err.response?.data?.error || 'Gagal melepas mesin');
        }
    };

    const openModal = (line?: ProductionLine) => {
        if (line) {
            setEditingLine(line);
            setFormData({
                code: line.code,
                name: line.name,
                description: line.description || '',
                capacity_per_hour: line.capacity_per_hour ? String(line.capacity_per_hour) : '',
            });
        } else {
            setEditingLine(null);
            setFormData({ code: '', name: '', description: '', capacity_per_hour: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLine(null);
    };

    const openAssignModal = (line: ProductionLine) => {
        setSelectedLine(line);
        const nextOrder = (line.Machine?.length || 0) + 1;
        setAssignForm({ id_machine: '', sequence_order: String(nextOrder) });
        setIsAssignModalOpen(true);
    };

    // Machines not yet assigned to any line (or assigned to this line)
    const availableMachines = machines.filter(m =>
        !m.id_production_line || (selectedLine && m.id_production_line === selectedLine.id)
    );

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <span className="material-symbols-outlined" style={{ fontSize: 28, marginRight: 8 }}>route</span>
                        Lini Produksi
                    </h1>
                    <p className="page-subtitle">Kelola lini produksi dan penugasan mesin</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()} disabled={!selectedFactory}>
                    <span className="material-symbols-outlined">add</span>
                    Tambah Lini
                </button>
            </div>

            {!selectedFactory && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    <span className="material-symbols-outlined">info</span>
                    Pilih pabrik terlebih dahulu di dropdown header untuk mengelola lini produksi.
                </div>
            )}

            {/* Production Lines Grid */}
            {loading ? (
                <div className="loading-container"><div className="loading-spinner" /></div>
            ) : lines.length === 0 ? (
                <div className="empty-state glass-card" style={{ padding: '60px 20px' }}>
                    <div className="empty-state-icon-container" style={{
                        background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                        width: 80, height: 80, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                        color: 'white', boxShadow: '0 10px 25px rgba(19, 127, 236, 0.3)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40 }}>route</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Belum ada lini produksi</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 300, margin: '0 auto' }}>Mulai dengan membuat lini produksi baru untuk mengelola mesin di pabrik Anda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                    {lines.map(line => (
                        <div key={line.id} className="glass-card premium-hover" style={{
                            padding: 0,
                            border: '1px solid var(--glass-border)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Card Header with Gradient Accent */}
                            <div style={{
                                height: 6,
                                background: line.is_active
                                    ? 'linear-gradient(90deg, var(--primary), var(--primary-light))'
                                    : 'linear-gradient(90deg, var(--text-muted), var(--border-color))'
                            }} />

                            <div style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: line.is_active ? 'var(--primary-light)' : 'var(--bg-elevated)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: line.is_active ? 'white' : 'var(--text-muted)',
                                            opacity: line.is_active ? 1 : 0.6
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>precision_manufacturing</span>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{line.name}</h3>
                                            <div style={{
                                                fontSize: 12,
                                                color: 'var(--primary)',
                                                fontWeight: 600,
                                                backgroundColor: 'rgba(19, 127, 236, 0.1)',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                display: 'inline-block',
                                                marginTop: 4
                                            }}>
                                                {line.code}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => handleToggleActive(line)}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            borderRadius: 20,
                                            backgroundColor: line.is_active ? 'var(--success-light)' : 'var(--error-light)',
                                            color: line.is_active ? 'var(--success)' : 'var(--error)',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            transition: 'var(--transition)'
                                        }}
                                    >
                                        <span className={`status-dot ${line.is_active ? 'pulse' : ''}`} style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            backgroundColor: 'currentColor'
                                        }} />
                                        {line.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </div>
                                </div>

                                {line.description && (
                                    <p style={{
                                        fontSize: 14,
                                        color: 'var(--text-secondary)',
                                        marginBottom: 20,
                                        lineHeight: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {line.description}
                                    </p>
                                )}

                                {/* Quick Stats Row */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 12,
                                    marginBottom: 24,
                                    padding: 12,
                                    backgroundColor: 'var(--bg-elevated)',
                                    borderRadius: 12
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{line._count?.Machine || 0}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Mesin</div>
                                    </div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{line._count?.Worksheet || 0}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Worksheets</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {line.capacity_per_hour ? Number(line.capacity_per_hour) : 0}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>kg/jam</div>
                                    </div>
                                </div>

                                {/* Modern Machine Flow Visualization */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                                            MACHINE SEQUENCE
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => openAssignModal(line)}
                                            style={{ color: 'var(--primary)', padding: '2px 8px' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>add_circle</span>
                                            Assign
                                        </button>
                                    </div>

                                    {line.Machine && line.Machine.length > 0 ? (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            position: 'relative',
                                            paddingLeft: 4
                                        }}>
                                            {/* Connector Line */}
                                            <div style={{
                                                position: 'absolute',
                                                left: 17, top: 20, bottom: 20,
                                                width: 2,
                                                background: 'linear-gradient(to bottom, var(--primary-light), var(--border-color))',
                                                zIndex: 0,
                                                opacity: 0.3
                                            }} />

                                            {line.Machine.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0)).map((m, idx) => (
                                                <div key={m.id} className="glass-card-sm premium-hover" style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)',
                                                    border: '1px solid var(--border-subtle)',
                                                    zIndex: 1,
                                                    transition: 'var(--transition)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 28, height: 28, borderRadius: 8,
                                                            background: 'var(--bg-elevated)', color: 'var(--primary)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 12, fontWeight: 800,
                                                            boxShadow: 'inset 0 0 0 1px var(--border-subtle)'
                                                        }}>{idx + 1}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.name}</div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.code}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span className={`badge ${m.status === 'RUNNING' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                                            {m.status}
                                                        </span>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleRemoveMachine(line.id, m.id)}
                                                            style={{ padding: 4, height: 28, width: 28, minWidth: 28, color: 'var(--error)' }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_sweep</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            border: '2px dashed var(--border-color)',
                                            borderRadius: 12,
                                            color: 'var(--text-muted)',
                                            fontSize: 13
                                        }}>
                                            Belum ada mesin ditugaskan
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div style={{
                                    display: 'flex',
                                    gap: 12,
                                    marginTop: 'auto',
                                    paddingTop: 20,
                                    borderTop: '1px solid var(--border-subtle)'
                                }}>
                                    <button
                                        className="btn btn-outline"
                                        style={{ flex: 1, height: 40 }}
                                        onClick={() => openModal(line)}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                                        Configure
                                    </button>
                                    <button
                                        className="btn btn-ghost"
                                        style={{ color: 'var(--error)', width: 40, height: 40, padding: 0 }}
                                        onClick={() => handleDelete(line.id)}
                                    >
                                        <span className="material-symbols-outlined">delete_forever</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {total > limit && (
                <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>{editingLine ? 'Edit Lini Produksi' : 'Tambah Lini Produksi'}</h2>
                            <button className="btn btn-ghost" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Kode Lini *</label>
                                    <input
                                        id="input-line-code"
                                        className="form-input"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="Contoh: LINE-A"
                                        maxLength={30}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama Lini *</label>
                                    <input
                                        id="input-line-name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Contoh: Lini Produksi A"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deskripsi</label>
                                    <textarea
                                        id="input-line-desc"
                                        className="form-input"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Keterangan lini produksi"
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kapasitas (kg/jam)</label>
                                    <input
                                        id="input-line-capacity"
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        value={formData.capacity_per_hour}
                                        onChange={e => setFormData({ ...formData, capacity_per_hour: e.target.value })}
                                        placeholder="Contoh: 500"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingLine ? 'Simpan Perubahan' : 'Tambah Lini'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Machine Modal */}
            {isAssignModalOpen && selectedLine && (
                <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2>Tambah Mesin ke {selectedLine.name}</h2>
                            <button className="btn btn-ghost" onClick={() => setIsAssignModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAssignMachine}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Pilih Mesin *</label>
                                    <select
                                        id="select-machine"
                                        className="form-input"
                                        value={assignForm.id_machine}
                                        onChange={e => setAssignForm({ ...assignForm, id_machine: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Pilih Mesin --</option>
                                        {availableMachines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Urutan *</label>
                                    <input
                                        id="input-sequence"
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        value={assignForm.sequence_order}
                                        onChange={e => setAssignForm({ ...assignForm, sequence_order: e.target.value })}
                                        required
                                    />
                                    <small style={{ color: 'var(--text-muted)' }}>Urutan mesin dalam lini produksi</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Tambah Mesin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionLines;
