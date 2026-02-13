import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import api from '../../services/api';
import { logger } from '../../utils/logger';

interface Maintenance {
    id: number;
    maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY';
    maintenance_date: string;
    cost: number;
    description: string;
    parts_replaced: string;
    next_maintenance_date: string;
    machine?: {
        id: number;
        code: string;
        name: string;
    };
    user?: {
        fullname: string;
    };
}

interface Machine {
    id: number;
    code: string;
    name: string;
}

const typeConfig = {
    PREVENTIVE: { label: 'Preventif', class: 'badge-info', icon: 'schedule' },
    CORRECTIVE: { label: 'Korektif', class: 'badge-warning', icon: 'build' },
    EMERGENCY: { label: 'Darurat', class: 'badge-error', icon: 'warning' }
};

const Maintenance = () => {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
    const [formData, setFormData] = useState({
        id_machine: '',
        maintenance_type: 'PREVENTIVE',
        maintenance_date: new Date().toISOString().split('T')[0],
        cost: '',
        description: '',
        parts_replaced: '',
        next_maintenance_date: ''
    });

    useEffect(() => {
        fetchMaintenances();
        fetchMachines();
    }, []);

    const fetchMaintenances = async () => {
        try {
            const response = await api.get('/maintenances');
            const data = response.data?.data || response.data || [];
            setMaintenances(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching maintenances:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const response = await api.get('/machines');
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
                ...formData,
                id_machine: parseInt(formData.id_machine),
                cost: parseFloat(formData.cost) || 0,
                id_user: 1
            };

            if (editingMaintenance) {
                await api.put(`/maintenances/${editingMaintenance.id}`, payload);
            } else {
                await api.post('/maintenances', payload);
            }
            fetchMaintenances();
            closeModal();
        } catch (error) {
            logger.error('Error saving maintenance:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus catatan maintenance ini?')) {
            try {
                await api.delete(`/maintenances/${id}`);
                fetchMaintenances();
            } catch (error) {
                logger.error('Error deleting maintenance:', error);
            }
        }
    };

    const openModal = (maintenance?: Maintenance) => {
        if (maintenance) {
            setEditingMaintenance(maintenance);
            setFormData({
                id_machine: maintenance.machine?.id?.toString() || '',
                maintenance_type: maintenance.maintenance_type,
                maintenance_date: maintenance.maintenance_date?.split('T')[0] || '',
                cost: maintenance.cost?.toString() || '',
                description: maintenance.description || '',
                parts_replaced: maintenance.parts_replaced || '',
                next_maintenance_date: maintenance.next_maintenance_date?.split('T')[0] || ''
            });
        } else {
            setEditingMaintenance(null);
            setFormData({
                id_machine: machines[0]?.id?.toString() || '',
                maintenance_type: 'PREVENTIVE',
                maintenance_date: new Date().toISOString().split('T')[0],
                cost: '',
                description: '',
                parts_replaced: '',
                next_maintenance_date: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMaintenance(null);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Stats
    const totalMaintenances = maintenances.length;
    const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
    const preventiveCount = maintenances.filter(m => m.maintenance_type === 'PREVENTIVE').length;
    const emergencyCount = maintenances.filter(m => m.maintenance_type === 'EMERGENCY').length;

    return (
        <>
            <Header title="Maintenance" subtitle="Riwayat dan jadwal perawatan mesin" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Maintenance</span>
                            <span className="material-symbols-outlined stat-card-icon">build</span>
                        </div>
                        <div className="stat-card-value">{totalMaintenances}</div>
                        <span className="badge badge-muted">Record</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Biaya</span>
                            <span className="material-symbols-outlined stat-card-icon">payments</span>
                        </div>
                        <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalCost)}</div>
                        <span className="badge badge-warning">Bulan Ini</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Preventif</span>
                            <span className="material-symbols-outlined stat-card-icon">schedule</span>
                        </div>
                        <div className="stat-card-value">{preventiveCount}</div>
                        <span className="badge badge-info">Terjadwal</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Darurat</span>
                            <span className="material-symbols-outlined stat-card-icon">warning</span>
                        </div>
                        <div className="stat-card-value">{emergencyCount}</div>
                        <span className="badge badge-error">Tidak Terjadwal</span>
                    </div>
                </div>

                {/* Maintenance List */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Riwayat Maintenance</h3>
                            <p className="card-subtitle">Catatan perawatan dan perbaikan mesin</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Catat Maintenance
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                            </div>
                            <h3>Memuat data...</h3>
                        </div>
                    ) : maintenances.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">build</span>
                            </div>
                            <h3>Belum ada catatan maintenance</h3>
                            <p>Klik tombol "Catat Maintenance" untuk menambahkan</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Mesin</th>
                                        <th>Tipe</th>
                                        <th>Deskripsi</th>
                                        <th>Biaya</th>
                                        <th>Teknisi</th>
                                        <th>Jadwal Berikutnya</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenances.map((maintenance) => {
                                        const type = typeConfig[maintenance.maintenance_type];
                                        return (
                                            <tr key={maintenance.id}>
                                                <td>{formatDate(maintenance.maintenance_date)}</td>
                                                <td>
                                                    <div>
                                                        <div className="font-bold">{maintenance.machine?.name || '-'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {maintenance.machine?.code}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${type.class}`}>
                                                        <span className="material-symbols-outlined icon-sm">{type.icon}</span>
                                                        {type.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="truncate" style={{ maxWidth: 200 }}>
                                                        {maintenance.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="font-mono">{formatCurrency(maintenance.cost || 0)}</td>
                                                <td>{maintenance.user?.fullname || '-'}</td>
                                                <td>{formatDate(maintenance.next_maintenance_date)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(maintenance)}>
                                                            <span className="material-symbols-outlined icon-sm">edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(maintenance.id)}>
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
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingMaintenance ? 'Edit Maintenance' : 'Catat Maintenance Baru'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Mesin</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.id_machine}
                                        onChange={(e) => setFormData({ ...formData, id_machine: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Mesin</option>
                                        {machines.map((m) => (
                                            <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipe Maintenance</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.maintenance_type}
                                        onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                                    >
                                        <option value="PREVENTIVE">Preventif (Terjadwal)</option>
                                        <option value="CORRECTIVE">Korektif (Perbaikan)</option>
                                        <option value="EMERGENCY">Darurat</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tanggal Maintenance</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.maintenance_date}
                                        onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Biaya (Rp)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        placeholder="500000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Deskripsi</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Deskripsi pekerjaan maintenance..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Parts yang Diganti</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.parts_replaced}
                                        onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                                        placeholder="Belt, Bearing, dll"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Jadwal Maintenance Berikutnya</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.next_maintenance_date}
                                        onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    {editingMaintenance ? 'Simpan Perubahan' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Maintenance;
