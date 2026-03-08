import { useState, useEffect } from 'react';
import { downtimeEventApi, machineApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import { formatDate } from '../../utils/formatUtils';

interface DowntimeEvent {
    id: number;
    id_machine: number;
    id_factory: number;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    category: 'PLANNED' | 'UNPLANNED' | 'CHANGEOVER' | 'CLEANING';
    reason?: string;
    resolution?: string;
    status: 'OPEN' | 'RESOLVED';
    Machine?: { name: string; code: string };
    User?: { fullname: string };
}

interface Machine {
    id: number;
    name: string;
    code: string;
}

const statusConfig = {
    OPEN: { label: 'Terbuka', class: 'badge-error', icon: 'warning' },
    RESOLVED: { label: 'Selesai', class: 'badge-success', icon: 'check_circle' },
};

const categoryConfig = {
    PLANNED: { label: 'Terjadwal', class: 'badge-primary' },
    UNPLANNED: { label: 'Tidak Terjadwal / Rusak', class: 'badge-error' },
    CHANGEOVER: { label: 'Ganti Setup', class: 'badge-warning' },
    CLEANING: { label: 'Pembersihan', class: 'badge-info' }
};

const DowntimeTracking = () => {
    const { showSuccess, showError } = useToast();
    const [downtimes, setDowntimes] = useState<DowntimeEvent[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [editingDowntime, setEditingDowntime] = useState<DowntimeEvent | null>(null);

    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 15;

    const { selectedFactory, setSelectedFactory, factories, loading: factoryLoading } = useFactory();

    const [formData, setFormData] = useState({
        id_machine: 0,
        start_time: '',
        end_time: '',
        category: 'UNPLANNED',
        reason: '',
    });

    const [resolveData, setResolveData] = useState({
        end_time: '',
        resolution: '',
    });

    useEffect(() => {
        if (!factoryLoading) {
            fetchDowntimes();
            fetchMachines();
        }
    }, [selectedFactory, page, factoryLoading]);

    const fetchDowntimes = async () => {
        try {
            setLoading(true);
            const response = await downtimeEventApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined
            });
            const data = response.data?.data || response.data || [];
            const total = response.data?.total || data.length;

            setDowntimes(Array.isArray(data) ? data : []);
            setTotalItems(total);
        } catch (error) {
            logger.error('Error fetching downtimes:', error);
            showError('Error', 'Gagal memuat data downtime');
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const response = await machineApi.getAll({
                id_factory: selectedFactory || undefined
            });
            const data = response.data?.data || response.data || [];
            setMachines(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching machines:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                id_factory: selectedFactory || 1,
                id_machine: Number(formData.id_machine),
                start_time: new Date(formData.start_time).toISOString(),
                end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
                category: formData.category,
                reason: formData.reason
            };

            if (editingDowntime) {
                await downtimeEventApi.update(editingDowntime.id, payload);
                showSuccess('Berhasil', 'Downtime berhasil diperbarui');
            } else {
                await downtimeEventApi.create(payload);
                showSuccess('Berhasil', 'Downtime tercatat');
            }
            fetchDowntimes();
            closeModal();
        } catch (error) {
            logger.error('Error saving downtime:', error);
            showError('Gagal', 'Gagal menyimpan data');
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDowntime) return;
        try {
            await downtimeEventApi.resolve(editingDowntime.id, {
                end_time: new Date(resolveData.end_time).toISOString(),
                resolution: resolveData.resolution
            });
            showSuccess('Berhasil', 'Mesin telah kembali beroperasi');
            fetchDowntimes();
            closeResolveModal();
        } catch (error) {
            logger.error('Error resolving downtime:', error);
            showError('Gagal', 'Pastikan waktu selesai tidak lebih awal dari waktu mulai');
        }
    }

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus catatan downtime ini?')) {
            try {
                await downtimeEventApi.delete(id);
                showSuccess('Berhasil', 'Catatan dihapus');
                fetchDowntimes();
            } catch (error) {
                logger.error('Error deleting downtime:', error);
                showError('Gagal', 'Terjadi kesalahan saat menghapus');
            }
        }
    };

    const openModal = (downtime?: DowntimeEvent) => {
        if (downtime) {
            setEditingDowntime(downtime);
            setFormData({
                id_machine: downtime.id_machine,
                start_time: downtime.start_time ? new Date(downtime.start_time).toISOString().slice(0, 16) : '',
                end_time: downtime.end_time ? new Date(downtime.end_time).toISOString().slice(0, 16) : '',
                category: downtime.category,
                reason: downtime.reason || '',
            });
        } else {
            setEditingDowntime(null);
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setFormData({
                id_machine: machines.length > 0 ? machines[0].id : 0,
                start_time: now.toISOString().slice(0, 16),
                end_time: '',
                category: 'UNPLANNED',
                reason: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDowntime(null);
    };

    const openResolveModal = (downtime: DowntimeEvent) => {
        setEditingDowntime(downtime);
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setResolveData({
            end_time: now.toISOString().slice(0, 16),
            resolution: '',
        });
        setShowResolveModal(true);
    };

    const closeResolveModal = () => {
        setShowResolveModal(false);
        setEditingDowntime(null);
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const activeDowntimes = downtimes.filter(d => d.status === 'OPEN').length;
    const totalDowntimeMinutes = downtimes.reduce((acc, obj) => acc + (obj.duration_minutes || 0), 0);

    return (
        <div className="page-content">
            {/* Factory Toggle */}
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

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Mesin Sedang Berhenti</span>
                        <span className="material-symbols-outlined stat-card-icon" style={{ color: 'var(--error)' }}>warning</span>
                    </div>
                    <div className="stat-card-value">{activeDowntimes}</div>
                    <span className="badge badge-error">Menunggu Perbaikan</span>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Durasi Hambatan (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">timer</span>
                    </div>
                    <div className="stat-card-value">{(totalDowntimeMinutes / 60).toFixed(1)}</div>
                    <span className="badge badge-muted">Jam</span>
                </div>
            </div>

            {/* Downtime List */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Log Downtime Mesin</h3>
                        <p className="card-subtitle">Lacak problem mesin dan jadwal ganti shift/cleaning</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Catat Downtime
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                ) : downtimes.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <h3>Tidak ada record downtime</h3>
                        <p>Produksi berjalan lancar tanpa hambatan.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mesin</th>
                                        <th>Kategori</th>
                                        <th>Waktu Mulai</th>
                                        <th>Waktu Selesai</th>
                                        <th>Durasi</th>
                                        <th>Penyebab / Alasan</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {downtimes.map((dw) => {
                                        const status = statusConfig[dw.status];
                                        const cat = categoryConfig[dw.category];
                                        return (
                                            <tr key={dw.id}>
                                                <td>
                                                    <span className="font-bold">{dw.Machine?.name || `ID: ${dw.id_machine}`}</span>
                                                    <br />
                                                    <span className="text-xs text-muted">{dw.Machine?.code}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${cat.class}`}>
                                                        {cat.label}
                                                    </span>
                                                </td>
                                                <td>{formatDate(dw.start_time, true)}</td>
                                                <td>{dw.end_time ? formatDate(dw.end_time, true) : '-'}</td>
                                                <td>
                                                    {dw.duration_minutes !== null && dw.duration_minutes !== undefined ? (
                                                        <span className="font-mono">{(dw.duration_minutes).toFixed(1)} mnt</span>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ maxWidth: 200 }} className="truncate">
                                                    {dw.reason || '-'}
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>
                                                        <span className="material-symbols-outlined icon-sm">{status.icon}</span>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        {dw.status === 'OPEN' && (
                                                            <button className="btn btn-primary btn-sm" onClick={() => openResolveModal(dw)}>
                                                                <span className="material-symbols-outlined icon-sm">build_circle</span>
                                                                Selesai
                                                            </button>
                                                        )}
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(dw)}>
                                                            <span className="material-symbols-outlined icon-sm">edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(dw.id)}>
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                    </>
                )}
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingDowntime ? 'Edit Catatan Downtime' : 'Catat Downtime Mesin'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Pilih Mesin <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.id_machine}
                                        onChange={(e) => setFormData({ ...formData, id_machine: Number(e.target.value) })}
                                        required
                                    >
                                        <option value={0}>Pilih Mesin...</option>
                                        {machines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kategori <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="UNPLANNED">Tidak Terjadwal / Breakdown</option>
                                        <option value="PLANNED">Terjadwal / Maintenance</option>
                                        <option value="CHANGEOVER">Ganti Setup / Tipe Beras</option>
                                        <option value="CLEANING">Pembersihan</option>
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Waktu Mulai <span style={{ color: 'var(--error)' }}>*</span></label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Waktu Selesai</label>
                                        <input
                                            type="datetime-local"
                                            className="form-input"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                        <small className="text-muted text-xs block mt-1">Kosongkan jika mesin masih rusak</small>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Penyebab / Alasan</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Jelaskan alasan mesin berhenti..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {showResolveModal && (
                <div className="modal-overlay" onClick={closeResolveModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Selesaikan Downtime</h3>
                            <button className="modal-close" onClick={closeResolveModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleResolve}>
                            <div className="modal-body">
                                <p className="mb-4 text-sm">Menutup pencatatan downtime untuk mesin <strong>{editingDowntime?.Machine?.name}</strong>.</p>
                                <div className="form-group">
                                    <label className="form-label">Waktu Selesai Kerusakan/Hambatan <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={resolveData.end_time}
                                        onChange={(e) => setResolveData({ ...resolveData, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tindakan Penyelesaian (Resolusi)</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={resolveData.resolution}
                                        onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                                        placeholder="Apa tindakan yang diambil untuk memperbaiki?"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeResolveModal}>Batal</button>
                                <button type="submit" className="btn btn-success">Selesai & Jalankan Mesin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DowntimeTracking;
