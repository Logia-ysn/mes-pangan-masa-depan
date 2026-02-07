import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Header from '../components/Layout/Header';
import api, { supplierApi, rawMaterialCategoryApi, rawMaterialVarietyApi } from '../services/api';
import QualityConfig from '../components/Settings/QualityConfig';

interface Supplier {
    id: number;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    is_active: boolean;
}

interface Category {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
}

interface Variety {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
}

type TabType = 'data' | 'suppliers' | 'categories' | 'varieties' | 'quality';

const Settings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('data');

    // Data lists
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [varieties, setVarieties] = useState<Variety[]>([]);

    // Add forms
    const [newSupplier, setNewSupplier] = useState({ code: '', name: '', contact_person: '', phone: '' });
    const [newCategory, setNewCategory] = useState({ code: '', name: '', description: '' });
    const [newVariety, setNewVariety] = useState({ code: '', name: '', description: '' });

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'danger' | 'success';
        onConfirm?: () => void;
        showCancel?: boolean;
    } | null>(null);

    useEffect(() => {
        if (activeTab === 'suppliers') fetchSuppliers();
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'varieties') fetchVarieties();
    }, [activeTab]);

    const fetchSuppliers = async () => {
        try {
            const res = await supplierApi.getAll();
            setSuppliers(res.data?.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await rawMaterialCategoryApi.getAll();
            setCategories(res.data?.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchVarieties = async () => {
        try {
            const res = await rawMaterialVarietyApi.getAll();
            setVarieties(res.data?.data || []);
        } catch (e) { console.error(e); }
    };

    const closeModal = () => setModalConfig(null);

    // === DATA MANAGEMENT ===
    const handleSeedClick = () => {
        setModalConfig({
            isOpen: true,
            title: 'Generate Data Dummy',
            message: 'Apakah Anda yakin ingin membuat data dummy? Ini akan menambahkan data sampel ke database.',
            type: 'info',
            onConfirm: performSeed,
            showCancel: true
        });
    };

    const handleResetClick = () => {
        setModalConfig({
            isOpen: true,
            title: 'Hapus Semua Data',
            message: 'PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA dummy? Tindakan ini tidak dapat dibatalkan.',
            type: 'danger',
            onConfirm: performReset,
            showCancel: true
        });
    };

    const performSeed = async () => {
        closeModal();
        setLoading(true);
        try {
            const res = await api.post('/admin/dummy/generate');
            showSuccess("Berhasil", `Data Dummy berhasil dibuat! Worksheets: ${res.data.created.worksheets}, Transaksi: ${res.data.created.transactions}`);
            // Refresh lists
            fetchSuppliers();
            fetchCategories();
            fetchVarieties();
        } catch (error: any) {
            showError("Gagal membuat data dummy", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const performReset = async () => {
        closeModal();
        setLoading(true);
        try {
            const res = await api.delete('/admin/dummy/reset');
            showSuccess("Berhasil", `Data transaksi berhasil dihapus. Item terhapus: ${res.data.deleted.transactions} transaksi, ${res.data.deleted.worksheets} worksheets.`);
            // Clear lists
            setSuppliers([]);
            setCategories([]);
            setVarieties([]);
            // Since we don't delete categories via resetAll() anymore (as per requirement to keep config), 
            // actually we should probably re-fetch them instead of clearing local state if they are kept.
            // But if resetAll() keeps them, we should fetch them.
            fetchSuppliers(); // Assuming suppliers might be reset or kept (DummyService keeps master, so fetch)
            fetchCategories();
            fetchVarieties();
        } catch (error: any) {
            showError("Gagal menghapus data", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    // === SUPPLIER CRUD ===
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
        try {
            await supplierApi.delete(id);
            fetchSuppliers();
            showSuccess("Berhasil", "Supplier berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    // === CATEGORY CRUD ===
    const handleAddCategory = async () => {
        if (!newCategory.code || !newCategory.name) {
            showError("Validasi", "Kode dan Nama wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await rawMaterialCategoryApi.create(newCategory);
            setNewCategory({ code: '', name: '', description: '' });
            fetchCategories();
            showSuccess("Berhasil", "Kategori berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Hapus kategori ini?')) return;
        try {
            await api.delete(`/raw-material-categories/${id}`);
            fetchCategories();
            showSuccess("Berhasil", "Kategori berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    // === VARIETY CRUD ===
    const handleAddVariety = async () => {
        if (!newVariety.code || !newVariety.name) {
            showError("Validasi", "Kode dan Nama wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await rawMaterialVarietyApi.create(newVariety);
            setNewVariety({ code: '', name: '', description: '' });
            fetchVarieties();
            showSuccess("Berhasil", "Varietas berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVariety = async (id: number) => {
        if (!confirm('Hapus varietas ini?')) return;
        try {
            await api.delete(`/raw-material-varieties/${id}`);
            fetchVarieties();
            showSuccess("Berhasil", "Varietas berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    const tabs: { key: TabType | 'quality'; label: string; icon: string }[] = [
        { key: 'data', label: 'Manajemen Data', icon: 'database' },
        { key: 'suppliers', label: 'Supplier', icon: 'local_shipping' },
        { key: 'categories', label: 'Kategori Bahan', icon: 'category' },
        { key: 'varieties', label: 'Jenis/Varietas', icon: 'grain' },
        { key: 'quality', label: 'Quality Config', icon: 'tune' },
    ];

    return (
        <>
            <Header title="Pengaturan" subtitle="Manajemen Konfigurasi Sistem" />

            <div className="page-content">
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span className="material-symbols-outlined icon-sm">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'quality' && <QualityConfig />}

                {activeTab === 'data' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Manajemen Data (Developer)</h3>
                            <p className="card-subtitle">Tools untuk mengisi atau membersihkan data sistem untuk keperluan testing.</p>
                        </div>
                        <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" onClick={handleSeedClick} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">dataset</span>
                                Generate Data Dummy
                            </button>
                            <button className="btn btn-error" onClick={handleResetClick} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">delete_forever</span>
                                Hapus Semua Data
                            </button>
                            {loading && (
                                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-symbols-outlined animate-spin icon-sm">sync</span>
                                    Memproses...
                                </span>
                            )}
                        </div>
                        <div style={{ padding: '0 24px 24px' }}>
                            <div className="alert alert-info" style={{ background: 'rgba(19, 127, 236, 0.1)', color: 'var(--primary)', padding: 16, borderRadius: 8 }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <span className="material-symbols-outlined">info</span>
                                    <div>
                                        <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Informasi</h4>
                                        <p style={{ fontSize: '0.875rem' }}>
                                            <strong>Generate Data:</strong> Membuat sample Karyawan, Pelanggan, Stok, Worksheet, dan Transaksi.<br />
                                            <strong>Hapus Data:</strong> Membersihkan semua data transaksi, stok, dan master data dummy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'suppliers' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Daftar Supplier</h3>
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
                                    {suppliers.length === 0 && (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data supplier</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Kategori Bahan Baku</h3>
                            <span className="badge badge-primary">{categories.length} kategori</span>
                        </div>
                        <div style={{ padding: 24 }}>
                            {/* Add Form */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Kode *</label>
                                    <input type="text" className="form-input" placeholder="PADI" value={newCategory.code}
                                        onChange={e => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Nama Kategori *</label>
                                    <input type="text" className="form-input" placeholder="Padi/Gabah" value={newCategory.name}
                                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Deskripsi</label>
                                    <input type="text" className="form-input" placeholder="Deskripsi..." value={newCategory.description}
                                        onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} />
                                </div>
                                <button className="btn btn-primary" onClick={handleAddCategory} disabled={loading}>
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Tambah
                                </button>
                            </div>
                            {/* Table */}
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th>Deskripsi</th>
                                        <th style={{ width: 80 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(c => (
                                        <tr key={c.id}>
                                            <td><code>{c.code}</code></td>
                                            <td>{c.name}</td>
                                            <td>{c.description || '-'}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteCategory(c.id)} title="Hapus">
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data kategori</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'varieties' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Jenis / Varietas Bahan</h3>
                            <span className="badge badge-primary">{varieties.length} varietas</span>
                        </div>
                        <div style={{ padding: 24 }}>
                            {/* Add Form */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Kode *</label>
                                    <input type="text" className="form-input" placeholder="IR64" value={newVariety.code}
                                        onChange={e => setNewVariety({ ...newVariety, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Nama Varietas *</label>
                                    <input type="text" className="form-input" placeholder="IR 64" value={newVariety.name}
                                        onChange={e => setNewVariety({ ...newVariety, name: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Deskripsi</label>
                                    <input type="text" className="form-input" placeholder="Deskripsi..." value={newVariety.description}
                                        onChange={e => setNewVariety({ ...newVariety, description: e.target.value })} />
                                </div>
                                <button className="btn btn-primary" onClick={handleAddVariety} disabled={loading}>
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Tambah
                                </button>
                            </div>
                            {/* Table */}
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th>Deskripsi</th>
                                        <th style={{ width: 80 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {varieties.map(v => (
                                        <tr key={v.id}>
                                            <td><code>{v.code}</code></td>
                                            <td>{v.name}</td>
                                            <td>{v.description || '-'}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteVariety(v.id)} title="Hapus">
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {varieties.length === 0 && (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data varietas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalConfig && modalConfig.isOpen && (
                <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000 }}>
                    <div className="modal modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{
                                color: modalConfig.type === 'danger' ? 'var(--error)' :
                                    modalConfig.type === 'success' ? 'var(--success)' : 'var(--text-primary)'
                            }}>
                                {modalConfig.type === 'danger' && <span className="material-symbols-outlined" style={{ marginRight: 8 }}>warning</span>}
                                {modalConfig.type === 'success' && <span className="material-symbols-outlined" style={{ marginRight: 8 }}>check_circle</span>}
                                {modalConfig.type === 'info' && <span className="material-symbols-outlined" style={{ marginRight: 8 }}>info</span>}
                                {modalConfig.title}
                            </h3>
                        </div>
                        <div className="modal-body">
                            <p>{modalConfig.message}</p>
                        </div>
                        <div className="modal-footer">
                            {modalConfig.showCancel && (
                                <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
                            )}
                            <button
                                className={`btn ${modalConfig.type === 'danger' ? 'btn-error' : modalConfig.type === 'success' ? 'btn-success' : 'btn-primary'}`}
                                onClick={modalConfig.onConfirm || closeModal}
                            >
                                {modalConfig.type === 'success' ? 'OK' : 'Konfirmasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Settings;
