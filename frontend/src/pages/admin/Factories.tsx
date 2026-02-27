import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { factoryApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Factory {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    batch_code_prefix?: string;
    is_active: boolean;
}

const Factories = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [newFactory, setNewFactory] = useState({
        code: '', name: '', address: '', phone: '', batch_code_prefix: ''
    });

    useEffect(() => { fetchFactories(); }, []);

    const fetchFactories = async () => {
        setLoading(true);
        try {
            const res = await factoryApi.getAll({ limit: 100, is_active: 'all' });
            setFactories(res.data?.data || []);
        } catch (e) {
            logger.error(e);
            showError("Gagal", "Tidak dapat mengambil data pabrik");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newFactory.code || !newFactory.name || !newFactory.batch_code_prefix) {
            showError("Validasi", "Kode, Nama, dan Kode Batch wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await factoryApi.create(newFactory);
            setNewFactory({ code: '', name: '', address: '', phone: '', batch_code_prefix: '' });
            fetchFactories();
            showSuccess("Berhasil", "Pabrik berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (factory: Factory) => {
        setLoading(true);
        try {
            await factoryApi.update(factory.id, { is_active: !factory.is_active });
            fetchFactories();
            showSuccess("Berhasil", `Pabrik ${factory.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus pabrik ini? Hanya bisa dihapus jika belum ada data terkait.')) return;
        setLoading(true);
        try {
            await factoryApi.delete(id);
            fetchFactories();
            showSuccess("Berhasil", "Pabrik berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || "Pabrik tidak bisa dihapus karena masih ada data terkait. Gunakan nonaktifkan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Manajemen Pabrik</h3>
                        <p className="card-subtitle">Kelola lokasi pabrik/plant</p>
                    </div>
                    <span className="badge badge-primary">{factories.length} pabrik</span>
                </div>
                <div style={{ padding: 24 }}>
                    {/* Add Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 140px 100px auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kode *</label>
                            <input type="text" className="form-input" placeholder="PMD-3"
                                value={newFactory.code}
                                onChange={e => setNewFactory({ ...newFactory, code: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nama Pabrik *</label>
                            <input type="text" className="form-input" placeholder="PMD 3"
                                value={newFactory.name}
                                onChange={e => setNewFactory({ ...newFactory, name: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Alamat</label>
                            <input type="text" className="form-input" placeholder="Jl. ..."
                                value={newFactory.address}
                                onChange={e => setNewFactory({ ...newFactory, address: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Telepon</label>
                            <input type="text" className="form-input" placeholder="08xxx"
                                value={newFactory.phone}
                                onChange={e => setNewFactory({ ...newFactory, phone: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kode Batch *</label>
                            <input type="text" className="form-input" placeholder="P3" maxLength={4}
                                value={newFactory.batch_code_prefix}
                                onChange={e => setNewFactory({ ...newFactory, batch_code_prefix: e.target.value.toUpperCase() })} />
                        </div>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah
                        </button>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                        Kode Batch digunakan sebagai prefix pada nomor batch produksi (maks 4 karakter, contoh: P1, P2, F1).
                    </p>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama</th>
                                    <th>Alamat</th>
                                    <th>Telepon</th>
                                    <th>Kode Batch</th>
                                    <th>Status</th>
                                    <th style={{ width: 120 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factories.map(f => (
                                    <tr key={f.id} style={{ opacity: f.is_active ? 1 : 0.5 }}>
                                        <td><code>{f.code}</code></td>
                                        <td>{f.name}</td>
                                        <td>{f.address || '-'}</td>
                                        <td>{f.phone || '-'}</td>
                                        <td><code>{f.batch_code_prefix || '-'}</code></td>
                                        <td>
                                            <span className={`badge ${f.is_active ? 'badge-success' : 'badge-warning'}`}>
                                                {f.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => handleToggleActive(f)}
                                                title={f.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                <span className="material-symbols-outlined">
                                                    {f.is_active ? 'toggle_on' : 'toggle_off'}
                                                </span>
                                            </button>
                                            <button className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => handleDelete(f.id)} title="Hapus">
                                                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Factories;
