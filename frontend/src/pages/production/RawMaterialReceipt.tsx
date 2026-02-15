import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import QualityAnalysisModal from '../../components/Production/QualityAnalysisModal';
import api, { stockApi, supplierApi, productTypeApi, rawMaterialCategoryApi, rawMaterialVarietyApi, qualityAnalysisApi } from '../../services/api';
import { formatDate, formatNumber, formatCurrency } from '../../utils/formatUtils';
import { printElement } from '../../utils/printUtils';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';

// Interface matching the form and backend
interface RawMaterialBatch {
    id: number;
    batchId: string;
    poNumber: string;
    dateReceived: string;
    supplier: string;
    materialType: string; // Product Type Name
    qualityGrade: string;
    moistureContent: number;
    netWeight: number;
    pricePerKg: number;
    otherCosts: number;
    notes: string;
    deliveryNoteUrl?: string;
    createdAt: string;
    supplierId?: string;
    categoryId?: string;
    varietyId?: string;
    factoryName?: string;
}

interface Supplier {
    id: number;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
}

interface RawMaterialCategory {
    id: number;
    code: string;
    name: string;
}

interface RawMaterialVariety {
    id: number;
    code: string;
    name: string;
}

const RawMaterialReceipt = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<RawMaterialBatch[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<RawMaterialCategory[]>([]);
    const [varieties, setVarieties] = useState<RawMaterialVariety[]>([]);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddVarietyModal, setShowAddVarietyModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ code: '', name: '', contact_person: '', phone: '' });
    const [newCategory, setNewCategory] = useState({ code: '', name: '', description: '' });
    const [newVariety, setNewVariety] = useState({ code: '', name: '', description: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    // Pagination & Factory hook
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const {
        selectedFactory,
        setSelectedFactory,
        factories,
        loading: factoryLoading
    } = useFactory();

    // Analysis Modal
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [printingBatch, setPrintingBatch] = useState<RawMaterialBatch | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        batchId: '',
        poNumber: '',
        dateReceived: new Date().toISOString().split('T')[0],
        supplierId: '',
        categoryId: '',
        varietyId: '',
        qualityGrade: '-',
        moistureContent: '',
        density: '',
        netWeight: '',
        pricePerKg: '',
        otherCosts: '0',
        notes: ''
    });

    const handleAnalysisSave = (data: any) => {
        setFormData({
            ...formData,
            moistureContent: data.moisture,
            density: data.density,
            qualityGrade: data.qualityGrade,
        });
        setShowAnalysisModal(false);
    };

    useEffect(() => {
        if (!factoryLoading) {
            fetchData();
        }
    }, [selectedFactory, page, factoryLoading]);

    useEffect(() => {
        fetchSuppliers();
        fetchCategories();
        fetchVarieties();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await supplierApi.getAll({ is_active: true });
            if (response.data && response.data.data) {
                setSuppliers(response.data.data);
            }
        } catch (error) {
            logger.error("Failed to fetch suppliers", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await rawMaterialCategoryApi.getAll({ is_active: true });
            if (response.data && response.data.data) {
                setCategories(response.data.data);
            }
        } catch (error) {
            logger.error("Failed to fetch categories", error);
        }
    };

    const fetchVarieties = async () => {
        try {
            const response = await rawMaterialVarietyApi.getAll({ is_active: true });
            if (response.data && response.data.data) {
                setVarieties(response.data.data);
            }
        } catch (error) {
            logger.error("Failed to fetch varieties", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/stock-movements', {
                params: {
                    limit: ITEMS_PER_PAGE,
                    offset: (page - 1) * ITEMS_PER_PAGE,
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    id_factory: selectedFactory || undefined
                }
            });

            const movements = response.data?.data || response.data || [];
            const total = response.data?.total || movements.length;

            if (movements && Array.isArray(movements)) {
                const receipts = movements.map((m: any) => {
                    let details: any = {};
                    try {
                        details = JSON.parse(m.notes || '{}');
                    } catch (e) {
                        details = { notes: m.notes };
                    }

                    const stock = m.Stock || m.otm_id_stock || m.stock;
                    const factory = stock?.Factory || stock?.factory || stock?.otm_id_factory || stock?.otm_factory;
                    const productType = stock?.ProductType || stock?.product_type || stock?.otm_id_product_type || stock?.otm_product_type;

                    return {
                        id: m.id,
                        batchId: details.batchId || `BATCH-${m.id}`,
                        poNumber: details.poNumber || '-',
                        dateReceived: m.created_at,
                        supplier: details.supplier || 'Unknown',
                        supplierId: details.supplierId || '',
                        materialType: productType?.name || details.category || 'Unknown',
                        categoryId: details.categoryId || '',
                        varietyId: details.varietyId || '',
                        qualityGrade: details.qualityGrade || '-',
                        moistureContent: details.moistureContent || 0,
                        netWeight: m.quantity,
                        pricePerKg: details.pricePerKg || 0,
                        otherCosts: details.otherCosts || 0,
                        notes: details.notes || '',
                        factoryName: factory?.name || 'Unknown',
                        createdAt: m.created_at
                    };
                });
                setBatches(receipts);
                setTotalItems(total);
            }
        } catch (error) {
            logger.error("Error fetching batches:", error);
            showError("Error", "Gagal memuat data penerimaan bahan baku");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBatchId = () => {
        const date = new Date();
        const year = date.getFullYear();
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setFormData(prev => ({ ...prev, batchId: `BTC-${year}-${rand}` }));
    };

    const handleSave = async () => {
        if (!selectedFactory) {
            showError("Validasi", "Pilih pabrik tujuan terlebih dahulu");
            return;
        }

        if (!formData.batchId || !formData.netWeight || !formData.categoryId || !formData.supplierId) {
            showError("Validasi", "Harap lengkapi field yang wajib (Batch ID, Supplier, Kategori, Berat Netto)");
            return;
        }

        setLoading(true);
        try {
            const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId));
            const productTypesResponse = await productTypeApi.getAll();
            const allProductTypes = productTypesResponse.data?.data || productTypesResponse.data || [];

            let matchedProductType = allProductTypes.find((pt: any) =>
                pt.code === selectedCategory?.code ||
                pt.name === selectedCategory?.name
            );

            if (!matchedProductType) {
                matchedProductType = allProductTypes.find((pt: any) => pt.code === 'GKP');
            }

            if (!matchedProductType) {
                const newTypeRes = await productTypeApi.create({
                    code: selectedCategory?.code || 'GKP',
                    name: selectedCategory?.name || 'Gabah Kering Panen',
                    unit: 'kg'
                });
                matchedProductType = newTypeRes.data?.data || newTypeRes.data;
            }

            const factoryId = selectedFactory;
            const stocksResponse = await stockApi.getAll({
                id_factory: factoryId,
                id_product_type: matchedProductType.id
            });
            const stocks = Array.isArray(stocksResponse.data) ? stocksResponse.data : stocksResponse.data?.data || [];

            let targetStock = stocks.find((s: any) =>
                s.id_factory === factoryId && s.id_product_type === matchedProductType.id
            );

            if (!targetStock) {
                const newStockRes = await api.post('/stocks', {
                    id_factory: factoryId,
                    id_product_type: matchedProductType.id,
                    quantity: 0,
                    unit: 'kg'
                });
                targetStock = newStockRes.data?.data || newStockRes.data;
            }

            const quantity = parseFloat(formData.netWeight);
            const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplierId));
            const selectedVariety = varieties.find(v => v.id === parseInt(formData.varietyId));

            const notesPayload = JSON.stringify({
                batchId: formData.batchId,
                poNumber: formData.poNumber,
                supplierId: formData.supplierId,
                supplier: selectedSupplier?.name || '',
                categoryId: formData.categoryId,
                category: selectedCategory?.name || '',
                varietyId: formData.varietyId,
                variety: selectedVariety?.name || '',
                qualityGrade: formData.qualityGrade,
                moistureContent: parseFloat(formData.moistureContent),
                density: parseFloat(formData.density),
                pricePerKg: parseFloat(formData.pricePerKg),
                otherCosts: parseFloat(formData.otherCosts || '0'),
                notes: formData.notes
            });

            const payload = {
                id_stock: targetStock.id,
                id_user: user?.id || 1,
                movement_type: 'IN',
                quantity: quantity,
                reference_type: 'RAW_MATERIAL_RECEIPT',
                reference_id: 0,
                notes: notesPayload
            };

            let stockRes;
            if (editingId) {
                stockRes = await api.put(`/stock-movements/${editingId}`, payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil diperbarui!");
            } else {
                stockRes = await api.post('/stock-movements', payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil disimpan!");
            }

            if (formData.qualityGrade && formData.qualityGrade !== '-' && formData.qualityGrade !== 'Out of Range') {
                try {
                    await qualityAnalysisApi.submit({
                        batch_id: formData.batchId,
                        id_stock_movement: editingId || stockRes.data?.data?.id || stockRes.data?.id,
                        variety_id: parseInt(formData.varietyId),
                        moisture_value: parseFloat(formData.moistureContent),
                        density_value: parseFloat(formData.density),
                        green_percentage: 0,
                        yellow_percentage: 0,
                        notes: 'Receipt Analysis Updated'
                    });
                } catch (qaError) {
                    logger.error("Failed to save quality analysis detail:", qaError);
                }
            }

            setEditingId(null);
            setFormData({
                batchId: '',
                poNumber: '',
                dateReceived: new Date().toISOString().split('T')[0],
                supplierId: '',
                categoryId: '',
                varietyId: '',
                qualityGrade: '-',
                moistureContent: '',
                density: '',
                netWeight: '',
                pricePerKg: '',
                otherCosts: '0',
                notes: ''
            });
            fetchData();

        } catch (error: any) {
            logger.error(error);
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus data penerimaan ini? Stok akan dikembalikan.")) return;
        try {
            await api.delete(`/stock-movements/${id}`);
            showSuccess("Berhasil", "Data berhasil dihapus");
            fetchData();
        } catch (error: any) {
            logger.error(error);
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    const handleSupplierChange = (value: string) => {
        if (value === '__add_new__') {
            setShowAddSupplierModal(true);
            setFormData({ ...formData, supplierId: '' });
        } else {
            setFormData({ ...formData, supplierId: value });
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === '__add_new__') {
            setShowAddCategoryModal(true);
            setFormData({ ...formData, categoryId: '' });
        } else {
            setFormData({ ...formData, categoryId: value });
        }
    };

    const handleVarietyChange = (value: string) => {
        if (value === '__add_new__') {
            setShowAddVarietyModal(true);
            setFormData({ ...formData, varietyId: '' });
        } else {
            setFormData({ ...formData, varietyId: value });
        }
    };

    const handleSaveNewSupplier = async () => {
        if (!newSupplier.code || !newSupplier.name) {
            showError("Validasi", "Kode dan Nama Supplier wajib diisi");
            return;
        }
        setLoading(true);
        try {
            const response = await supplierApi.create(newSupplier);
            if (response.data) {
                fetchSuppliers();
                setFormData({ ...formData, supplierId: String(response.data.id || response.data.data?.id) });
                setShowAddSupplierModal(false);
                setNewSupplier({ code: '', name: '', contact_person: '', phone: '' });
                showSuccess("Berhasil", "Supplier berhasil ditambahkan!");
            }
        } catch (error: any) {
            logger.error(error);
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNewCategory = async () => {
        if (!newCategory.code || !newCategory.name) {
            showError("Validasi", "Kode dan Nama Kategori wajib diisi");
            return;
        }
        setLoading(true);
        try {
            const response = await rawMaterialCategoryApi.create(newCategory);
            if (response.data) {
                fetchCategories();
                setFormData({ ...formData, categoryId: String(response.data.id || response.data.data?.id) });
                setShowAddCategoryModal(false);
                setNewCategory({ code: '', name: '', description: '' });
                showSuccess("Berhasil", "Kategori berhasil ditambahkan!");
            }
        } catch (error: any) {
            logger.error(error);
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNewVariety = async () => {
        if (!newVariety.code || !newVariety.name) {
            showError("Validasi", "Kode dan Nama Varietas wajib diisi");
            return;
        }
        setLoading(true);
        try {
            const response = await rawMaterialVarietyApi.create(newVariety);
            if (response.data) {
                fetchVarieties();
                setFormData({ ...formData, varietyId: String(response.data.id || response.data.data?.id) });
                setShowAddVarietyModal(false);
                setNewVariety({ code: '', name: '', description: '' });
                showSuccess("Berhasil", "Varietas berhasil ditambahkan!");
            }
        } catch (error: any) {
            logger.error(error);
            showError("Gagal", error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };





    const handleEdit = (batch: RawMaterialBatch) => {
        setEditingId(batch.id);
        try {
            // Re-find movement to get full notes if needed, or but batch already has them
        } catch (e) { }

        setFormData({
            batchId: batch.batchId,
            poNumber: batch.poNumber,
            dateReceived: batch.dateReceived ? new Date(batch.dateReceived).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            supplierId: batch.supplierId || '',
            categoryId: batch.categoryId || '',
            varietyId: batch.varietyId || '',
            qualityGrade: batch.qualityGrade,
            moistureContent: String(batch.moistureContent),
            density: '',
            netWeight: String(batch.netWeight),
            pricePerKg: String(batch.pricePerKg),
            otherCosts: String(batch.otherCosts || 0),
            notes: batch.notes
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrint = (batch: RawMaterialBatch) => {
        setPrintingBatch(batch);
        setTimeout(() => {
            const onAfterPrint = () => {
                setPrintingBatch(null);
                window.removeEventListener('afterprint', onAfterPrint);
            };
            window.addEventListener('afterprint', onAfterPrint);
            printElement('receipt-print', `Tanda Terima - ${batch.batchId}`);
        }, 500);
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

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

            {/* Entry Form */}
            {selectedFactory ? (
                <div className="card mb-6">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>add_circle</span>
                            <h3 className="card-title">{editingId ? 'Edit Batch' : 'Entry Batch Baru'}</h3>
                        </div>
                    </div>

                    <div style={{ padding: 24 }}>
                        <div className="grid-4" style={{ marginBottom: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Batch ID</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="BTC-2023-001"
                                        value={formData.batchId}
                                        onChange={e => setFormData({ ...formData, batchId: e.target.value })}
                                    />
                                    <button className="btn btn-secondary" onClick={handleGenerateBatchId}>
                                        <span className="material-symbols-outlined icon-sm">auto_awesome</span>
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">PO Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="PO-88421"
                                    value={formData.poNumber}
                                    onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tanggal Terima</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.dateReceived}
                                    onChange={e => setFormData({ ...formData, dateReceived: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Supplier</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.supplierId}
                                    onChange={e => handleSupplierChange(e.target.value)}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    <option value="__add_new__" style={{ color: 'var(--primary)' }}>+ Tambah Supplier Baru</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-3" style={{ marginBottom: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Kategori Bahan</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.categoryId}
                                    onChange={e => handleCategoryChange(e.target.value)}
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    <option value="__add_new__" style={{ color: 'var(--primary)' }}>+ Tambah Kategori Baru</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Jenis / Varietas</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.varietyId}
                                    onChange={e => handleVarietyChange(e.target.value)}
                                >
                                    <option value="">Pilih Jenis</option>
                                    {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    <option value="__add_new__" style={{ color: 'var(--primary)' }}>+ Tambah Varietas Baru</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quality Analysis</label>
                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%', height: 44 }}
                                    onClick={() => {
                                        if (!formData.varietyId) {
                                            showWarning("Perhatian", "Pilih Varietas terlebih dahulu");
                                            return;
                                        }
                                        setShowAnalysisModal(true);
                                    }}
                                >
                                    <span className="material-symbols-outlined icon-sm">science</span>
                                    {formData.qualityGrade !== '-' ? `Grade: ${formData.qualityGrade}` : 'Perform Analysis'}
                                </button>
                            </div>
                        </div>

                        <div className="grid-4" style={{ marginBottom: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Berat Netto (Kg)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.netWeight}
                                        onChange={e => setFormData({ ...formData, netWeight: e.target.value })}
                                        placeholder="0"
                                    />
                                    <span className="input-addon">Kg</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Harga per Kg</label>
                                <div className="input-group">
                                    <span className="input-addon">Rp</span>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.pricePerKg}
                                        onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Biaya Lainnya</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.otherCosts}
                                    onChange={e => setFormData({ ...formData, otherCosts: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Catatan</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="..."
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            {editingId && (
                                <button className="btn btn-secondary" onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        batchId: '', poNumber: '', dateReceived: new Date().toISOString().split('T')[0],
                                        supplierId: '', categoryId: '', varietyId: '', qualityGrade: '-',
                                        moistureContent: '', density: '', netWeight: '', pricePerKg: '',
                                        otherCosts: '0', notes: ''
                                    });
                                }}>Batal Edit</button>
                            )}
                            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">save</span>
                                {editingId ? 'Simpan Perubahan' : 'Catat Penerimaan'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 24, textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, marginBottom: 24 }}>
                    <p style={{ color: '#b45309' }}>Silakan pilih pabrik terlebih dahulu untuk menambah data penerimaan.</p>
                </div>
            )}

            {/* List Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Riwayat Penerimaan</h3>
                </div>

                {loading && batches.length === 0 ? (
                    <div className="empty-state"><h3>Memuat data...</h3></div>
                ) : batches.length === 0 ? (
                    <div className="empty-state"><h3>Belum ada data penerimaan</h3></div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Pabrik</th>
                                        <th>Batch ID / PO</th>
                                        <th>Supplier</th>
                                        <th>Bahan</th>
                                        <th>Grade / Mhst</th>
                                        <th>Berat</th>
                                        <th>Total Biaya</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map(batch => (
                                        <tr key={batch.id}>
                                            <td><span className="badge badge-muted">{batch.factoryName}</span></td>
                                            <td>
                                                <div className="font-bold" style={{ color: 'var(--primary)' }}>{batch.batchId}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{batch.poNumber}</div>
                                            </td>
                                            <td>{batch.supplier}</td>
                                            <td>{batch.materialType}</td>
                                            <td>
                                                <span className={`badge ${batch.qualityGrade === 'KW 1' ? 'badge-success' : 'badge-warning'}`}>
                                                    {batch.qualityGrade}
                                                </span>
                                                <span style={{ marginLeft: 8, fontSize: '0.8rem' }}>{batch.moistureContent}%</span>
                                            </td>
                                            <td><span className="font-mono">{formatNumber(batch.netWeight)}</span> kg</td>
                                            <td><span className="font-mono">{formatCurrency(batch.netWeight * batch.pricePerKg + Number(batch.otherCosts))}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(batch)} title="Cetak Surat Jalan">
                                                        <span className="material-symbols-outlined icon-sm">print</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(batch)}>
                                                        <span className="material-symbols-outlined icon-sm">edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(batch.id)}>
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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

            {/* Modals */}
            {showAnalysisModal && (
                <QualityAnalysisModal
                    batchId={formData.batchId}
                    onClose={() => setShowAnalysisModal(false)}
                    onSave={handleAnalysisSave}
                />
            )}

            {/* Add Modals (Simplified for context) */}
            {showAddSupplierModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Tambah Supplier</h3></div>
                        <div className="modal-body">
                            <div className="grid-2" style={{ gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Kode</label>
                                    <input type="text" className="form-input" placeholder="SPL-001" value={newSupplier.code} onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama Supplier</label>
                                    <input type="text" className="form-input" placeholder="Nama..." value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Kontak (CP)</label>
                                    <input type="text" className="form-input" placeholder="Nama Kontak..." value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Telepon</label>
                                    <input type="text" className="form-input" placeholder="08..." value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddSupplierModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSaveNewSupplier}>Simpan Supplier</button>
                        </div>
                    </div>
                </div>
            )}
            {showAddCategoryModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Tambah Kategori</h3></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Kode</label>
                                <input type="text" className="form-input" placeholder="KAT-001" value={newCategory.code} onChange={e => setNewCategory({ ...newCategory, code: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Kategori</label>
                                <input type="text" className="form-input" placeholder="Nama..." value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Keterangan</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Deskripsi..."
                                    rows={2}
                                    value={newCategory.description}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSaveNewCategory}>Simpan Kategori</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddVarietyModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Tambah Varietas</h3></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Kode</label>
                                <input type="text" className="form-input" placeholder="VAR-001" value={newVariety.code} onChange={e => setNewVariety({ ...newVariety, code: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Varietas</label>
                                <input type="text" className="form-input" placeholder="Nama..." value={newVariety.name} onChange={e => setNewVariety({ ...newVariety, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Keterangan</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Deskripsi..."
                                    rows={2}
                                    value={newVariety.description}
                                    onChange={e => setNewVariety({ ...newVariety, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddVarietyModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSaveNewVariety}>Simpan Varietas</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Container (Hidden) */}
            {printingBatch && (
                <div id="receipt-print" style={{ display: 'none', padding: 40 }}>
                    <h2 style={{ textAlign: 'center' }}>TANDA TERIMA BAHAN BAKU</h2>
                    <hr />
                    <p><strong>Batch ID:</strong> {printingBatch.batchId}</p>
                    <p><strong>Supplier:</strong> {printingBatch.supplier}</p>
                    <p><strong>Tanggal:</strong> {formatDate(printingBatch.dateReceived)}</p>
                    <p><strong>Berat:</strong> {formatNumber(printingBatch.netWeight)} kg</p>
                    <br />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>Penerima<br /><br /><br />(................)</div>
                        <div>Pengirim<br /><br /><br />(................)</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RawMaterialReceipt;
