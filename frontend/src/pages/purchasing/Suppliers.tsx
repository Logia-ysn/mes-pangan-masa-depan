import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { supplierApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Supplier {
    id: number;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    is_active: boolean;
}

const Suppliers = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [newSupplier, setNewSupplier] = useState({ code: '', name: '', contact_person: '', phone: '' });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await supplierApi.getAll();
            setSuppliers(res.data?.data || []);
        } catch (e) {
            logger.error(e);
            showError("Gagal", "Tidak dapat mengambil data supplier");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplier.code || !newSupplier.name) {
            showError("Validasi", "Kode dan Nama wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await supplierApi.create(newSupplier);
            setNewSupplier({ code: '', name: '', contact_person: '', phone: '' });
            fetchSuppliers();
            showSuccess("Berhasil", "Supplier berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSupplier = async (id: number) => {
        if (!confirm('Hapus supplier ini?')) return;
        setLoading(true);
        try {
            await supplierApi.delete(id);
            fetchSuppliers();
            showSuccess("Berhasil", "Supplier berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Daftar Supplier</h3>
                        <p className="card-subtitle">Kelola data pemasok bahan baku</p>
                    </div>
                    <span className="badge badge-primary">{suppliers.length} supplier</span>
                </div>
                <div style={{ padding: 24 }}>
                    {/* Add Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kode *</label>
                            <input type="text" className="form-input" placeholder="SUP-001" value={newSupplier.code}
                                onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nama Supplier *</label>
                            <input type="text" className="form-input" placeholder="PT. Nama" value={newSupplier.name}
                                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kontak</label>
                            <input type="text" className="form-input" placeholder="Nama PIC" value={newSupplier.contact_person}
                                onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Telepon</label>
                            <input type="text" className="form-input" placeholder="08xxx" value={newSupplier.phone}
                                onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                        </div>
                        <button className="btn btn-primary" onClick={handleAddSupplier} disabled={loading}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah
                        </button>
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama</th>
                                    <th>Kontak</th>
                                    <th>Telepon</th>
                                    <th style={{ width: 80 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <tr key={s.id}>
                                        <td><code>{s.code}</code></td>
                                        <td>{s.name}</td>
                                        <td>{s.contact_person || '-'}</td>
                                        <td>{s.phone || '-'}</td>
                                        <td>
                                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteSupplier(s.id)} title="Hapus">
                                                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && !loading && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Tidak ada data supplier</td></tr>
                                )}
                                {loading && suppliers.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Memuat data...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Suppliers;
