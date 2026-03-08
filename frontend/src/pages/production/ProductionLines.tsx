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
                <div className="empty-state">
                    <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-muted)' }}>route</span>
                    <h3>Belum ada lini produksi</h3>
                    <p>Klik "Tambah Lini" untuk membuat lini produksi baru.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                    {lines.map(line => (
                        <div key={line.id} className="card" style={{ padding: 20 }}>
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>route</span>
                                        {line.name}
                                    </h3>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{line.code}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <span
                                        className={`badge ${line.is_active ? 'badge-success' : 'badge-error'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggleActive(line)}
                                        title={line.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                                    >
                                        {line.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {line.description && (
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                                    {line.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>precision_manufacturing</span>
                                    <strong>{line._count?.Machine || 0}</strong> mesin
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                                    <strong>{line._count?.Worksheet || 0}</strong> worksheet
                                </div>
                                {line.capacity_per_hour && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>speed</span>
                                        {Number(line.capacity_per_hour)} kg/jam
                                    </div>
                                )}
                            </div>

                            {/* Machines List */}
                            {line.Machine && line.Machine.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Mesin dalam lini
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {line.Machine.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0)).map((m, idx) => (
                                            <div key={m.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '6px 10px', borderRadius: 6, background: 'var(--bg-secondary)',
                                                fontSize: 13
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        width: 20, height: 20, borderRadius: '50%',
                                                        background: 'var(--primary)', color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 11, fontWeight: 700
                                                    }}>{idx + 1}</span>
                                                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({m.code})</span>
                                                </div>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleRemoveMachine(line.id, m.id)}
                                                    title="Lepas dari lini"
                                                    style={{ padding: '2px 6px' }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                <button className="btn btn-outline btn-sm" onClick={() => openAssignModal(line)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                                    Tambah Mesin
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => openModal(line)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                                    Edit
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(line.id)} style={{ color: 'var(--error)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                </button>
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
