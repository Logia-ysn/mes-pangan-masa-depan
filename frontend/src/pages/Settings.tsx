import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

import api, {
    rawMaterialCategoryApi,
    riceVarietyApi,
    riceLevelApi,
    riceBrandApi
} from '../services/api';
import QualityConfig from '../components/Settings/QualityConfig';
import FactoryMaterialConfig from '../components/Settings/FactoryMaterialConfig';
import { logger } from '../utils/logger';

interface Category {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
}

interface ItemBase {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    sort_order?: number;
}

type TabType = 'data' | 'suppliers' | 'categories' | 'varieties' | 'levels' | 'brands' | 'factory_materials' | 'quality';

const Settings = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('categories');

    // Data lists
    const [categories, setCategories] = useState<Category[]>([]);
    const [varieties, setVarieties] = useState<ItemBase[]>([]);
    const [levels, setLevels] = useState<ItemBase[]>([]);
    const [brands, setBrands] = useState<ItemBase[]>([]);
    const [confirmText, setConfirmText] = useState('');

    // Add forms
    const [newCategory, setNewCategory] = useState({ code: '', name: '', description: '' });
    const [newVariety, setNewVariety] = useState({ code: '', name: '', description: '' });
    const [newLevel, setNewLevel] = useState({ code: '', name: '', sort_order: 0 });
    const [newBrand, setNewBrand] = useState({ code: '', name: '' });

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'danger' | 'success';
        onConfirm?: () => void;
        showCancel?: boolean;
    } | null>(null);

    useEffect(() => {
        if (activeTab === 'categories') fetchCategories();
        if (activeTab === 'varieties') fetchVarieties();
        if (activeTab === 'levels') fetchLevels();
        if (activeTab === 'brands') fetchBrands();
    }, [activeTab]);

    const fetchCategories = async () => {
        try {
            const res = await rawMaterialCategoryApi.getAll();
            setCategories(res.data?.data || []);
        } catch (e) { logger.error(e); }
    };

    const fetchVarieties = async () => {
        try {
            const res = await riceVarietyApi.getAll();
            setVarieties(res.data || []);
        } catch (e) { logger.error(e); }
    };

    const fetchLevels = async () => {
        try {
            const res = await riceLevelApi.getAll();
            setLevels(res.data || []);
        } catch (e) { logger.error(e); }
    };

    const fetchBrands = async () => {
        try {
            const res = await riceBrandApi.getAll();
            setBrands(res.data || []);
        } catch (e) { logger.error(e); }
    };

    const closeModal = () => setModalConfig(null);

    // === DATA MANAGEMENT ===
    const handleSeedClick = () => {
        setModalConfig({
            isOpen: true,
            title: 'Generate Data Dummy',
            message: 'Apakah Anda yakin ingin membuat data dummy? Ini akan menambahkan data sampel ke database (Multi-Factory, Sales, Purchasing).',
            type: 'info',
            onConfirm: performSeed,
            showCancel: true
        });
    };

    const handleDeleteDummyClick = () => {
        setModalConfig({
            isOpen: true,
            title: 'Hapus Data Dummy',
            message: 'Apakah Anda yakin ingin menghapus data dummy? Data asli (non-dummy) akan tetap aman.',
            type: 'info',
            onConfirm: performDeleteDummy,
            showCancel: true
        });
    };

    const handleHardResetClick = () => {
        setConfirmText('');
        setModalConfig({
            isOpen: true,
            title: 'Hard Reset',
            message: 'BAHAYA: Ini akan MENGHAPUS SEMUA DATA (transaksi + master data) kecuali User dan Factory. Tindakan ini TIDAK DAPAT dibatalkan.',
            type: 'danger',
            onConfirm: performHardReset,
            showCancel: true
        });
    };

    const performSeed = async () => {
        closeModal();
        setLoading(true);
        try {
            const res = await api.post('/admin/dummy/generate');
            const c = res.data.created;
            showSuccess("Berhasil",
                `Data dummy berhasil dibuat! ${c.worksheets} worksheets, ${c.transactions} movements, ${c.sales} invoices, ${c.purchasing} POs.`
            );
            fetchCategories();
            fetchVarieties();
            fetchLevels();
            fetchBrands();
        } catch (error: any) {
            showError("Gagal membuat data dummy", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const performDeleteDummy = async () => {
        closeModal();
        setLoading(true);
        try {
            const res = await api.delete('/admin/dummy/delete');
            const d = res.data.deleted;
            showSuccess("Berhasil",
                `Data dummy berhasil dihapus! ${d.worksheets} worksheets, ${d.movements} movements, ${d.invoices} invoices, ${d.purchase_orders} POs.`
            );
            fetchCategories();
            fetchVarieties();
            fetchLevels();
            fetchBrands();
        } catch (error: any) {
            showError("Gagal menghapus data dummy", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const performHardReset = async () => {
        closeModal();
        setLoading(true);
        try {
            const res = await api.delete('/admin/hard-reset');
            const totalDeleted = Object.values(res.data.deleted as Record<string, number>)
                .reduce((sum, val) => sum + val, 0);
            showSuccess("Hard Reset Berhasil", `${totalDeleted} records berhasil dihapus.`);
            setCategories([]);
            setVarieties([]);
            setLevels([]);
            setBrands([]);
        } catch (error: any) {
            showError("Gagal melakukan hard reset", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
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
            await riceVarietyApi.create(newVariety);
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
            await riceVarietyApi.delete(id);
            fetchVarieties();
            showSuccess("Berhasil", "Varietas berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    // === LEVEL CRUD ===
    const handleAddLevel = async () => {
        if (!newLevel.code || !newLevel.name) {
            showError("Validasi", "Kode dan Nama wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await riceLevelApi.create(newLevel);
            setNewLevel({ code: '', name: '', sort_order: 0 });
            fetchLevels();
            showSuccess("Berhasil", "Level berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLevel = async (id: number) => {
        if (!confirm('Hapus level ini?')) return;
        try {
            await riceLevelApi.delete(id);
            fetchLevels();
            showSuccess("Berhasil", "Level berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    // === BRAND CRUD ===
    const handleAddBrand = async () => {
        if (!newBrand.code || !newBrand.name) {
            showError("Validasi", "Kode dan Nama wajib diisi");
            return;
        }
        setLoading(true);
        try {
            await riceBrandApi.create(newBrand);
            setNewBrand({ code: '', name: '' });
            fetchBrands();
            showSuccess("Berhasil", "Merk berhasil ditambahkan");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBrand = async (id: number) => {
        if (!confirm('Hapus merk ini?')) return;
        try {
            await riceBrandApi.delete(id);
            fetchBrands();
            showSuccess("Berhasil", "Merk berhasil dihapus");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: 'categories', label: 'Kategori Bahan', icon: 'category' },
        { key: 'varieties', label: 'Varietas Padi', icon: 'grain' },
        { key: 'levels', label: 'Level Beras', icon: 'stairs' },
        { key: 'brands', label: 'Merk Beras', icon: 'sell' },
        { key: 'factory_materials', label: 'Bahan per Pabrik', icon: 'factory' },
        { key: 'quality', label: 'Quality Config', icon: 'tune' },
    ];

    return (
        <>
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
                                Generate Dummy
                            </button>
                            <button className="btn btn-warning" onClick={handleDeleteDummyClick} disabled={loading}
                                style={{ background: 'var(--warning)', color: '#000' }}>
                                <span className="material-symbols-outlined icon-sm">delete_sweep</span>
                                Hapus Dummy
                            </button>
                            <button className="btn btn-error" onClick={handleHardResetClick} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">delete_forever</span>
                                Hard Reset
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
                                            <strong>Generate Dummy:</strong> Membuat data sample produksi (PMD 1 &amp; PMD 2), stok, worksheet, invoice, dan purchase order.<br />
                                            <strong>Hapus Dummy:</strong> Menghapus HANYA data dummy yang di-generate. Data asli tetap aman.<br />
                                            <strong>Hard Reset:</strong> Menghapus SEMUA data transaksi dan master data (kecuali User &amp; Factory). HATI-HATI!
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                            <h3 className="card-title">Jenis / Varietas Padi</h3>
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

                {activeTab === 'levels' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Level / Kualitas Beras</h3>
                            <span className="badge badge-primary">{levels.length} level</span>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Kode *</label>
                                    <input type="text" className="form-input" placeholder="MEDIUM" value={newLevel.code}
                                        onChange={e => setNewLevel({ ...newLevel, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Nama Level *</label>
                                    <input type="text" className="form-input" placeholder="Medium" value={newLevel.name}
                                        onChange={e => setNewLevel({ ...newLevel, name: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Urutan</label>
                                    <input type="number" className="form-input" value={newLevel.sort_order}
                                        onChange={e => setNewLevel({ ...newLevel, sort_order: parseInt(e.target.value) })} />
                                </div>
                                <button className="btn btn-primary" onClick={handleAddLevel} disabled={loading}>
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Tambah
                                </button>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th>Urutan</th>
                                        <th style={{ width: 80 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {levels.map(l => (
                                        <tr key={l.id}>
                                            <td><code>{l.code}</code></td>
                                            <td>{l.name}</td>
                                            <td>{l.sort_order}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteLevel(l.id)}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'brands' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merk / Brand Beras</h3>
                            <span className="badge badge-primary">{brands.length} merk</span>
                        </div>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Kode *</label>
                                    <input type="text" className="form-input" placeholder="WALEMU" value={newBrand.code}
                                        onChange={e => setNewBrand({ ...newBrand, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Nama Merk *</label>
                                    <input type="text" className="form-input" placeholder="Walemu" value={newBrand.name}
                                        onChange={e => setNewBrand({ ...newBrand, name: e.target.value })} />
                                </div>
                                <button className="btn btn-primary" onClick={handleAddBrand} disabled={loading}>
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Tambah
                                </button>
                            </div>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th style={{ width: 80 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brands.map(b => (
                                        <tr key={b.id}>
                                            <td><code>{b.code}</code></td>
                                            <td>{b.name}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteBrand(b.id)}>
                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'factory_materials' && <FactoryMaterialConfig />}
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
                            {/* Hard Reset double confirmation */}
                            {modalConfig.title === 'Hard Reset' && (
                                <div style={{ marginTop: 16 }}>
                                    <label className="form-label">Ketik <strong>HARD RESET</strong> untuk konfirmasi:</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="HARD RESET"
                                        value={confirmText}
                                        onChange={e => setConfirmText(e.target.value)}
                                        style={{ marginTop: 8 }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {modalConfig.showCancel && (
                                <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
                            )}
                            <button
                                className={`btn ${modalConfig.type === 'danger' ? 'btn-error' : modalConfig.type === 'success' ? 'btn-success' : 'btn-primary'}`}
                                onClick={modalConfig.onConfirm || closeModal}
                                disabled={modalConfig.title === 'Hard Reset' && confirmText !== 'HARD RESET'}
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
