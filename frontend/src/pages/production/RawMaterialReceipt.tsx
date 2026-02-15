import { useState, useEffect, useRef } from 'react';
import Header from '../../components/Layout/Header';
import { useToast } from '../../contexts/ToastContext';
import QualityAnalysisModal from '../../components/Production/QualityAnalysisModal';
import api, { stockApi, supplierApi, productTypeApi, rawMaterialCategoryApi, rawMaterialVarietyApi, qualityAnalysisApi, factoryApi } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/formatUtils';
import { printElement } from '../../utils/printUtils';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

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

interface ProductType {
    id: number;
    code: string;
    name: string;
    unit: string;
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

interface Factory {
    id: number;
    code: string;
    name: string;
}

const RawMaterialReceipt = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState<RawMaterialBatch[]>([]);
    const [_productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<RawMaterialCategory[]>([]);
    const [varieties, setVarieties] = useState<RawMaterialVariety[]>([]);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddVarietyModal, setShowAddVarietyModal] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ code: '', name: '', contact_person: '', phone: '' });
    const [newCategory, setNewCategory] = useState({ code: '', name: '', description: '' });
    const [newVariety, setNewVariety] = useState({ code: '', name: '', description: '' });
    const [deliveryNoteFile, setDeliveryNoteFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Analysis Modal
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [selectedBatchForAnalysis, setSelectedBatchForAnalysis] = useState<RawMaterialBatch | null>(null);
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
            otherCosts: formData.otherCosts // Keep existing
        });
        setShowAnalysisModal(false);
    };

    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);

    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const res = await factoryApi.getAll();
                const data = res.data?.data || res.data || [];
                const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
                setFactories(pmdFactories);
                const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
                if (pmd1) setSelectedFactory(pmd1.id);
                else if (pmdFactories.length > 0) setSelectedFactory(pmdFactories[0].id);
            } catch (error) {
                logger.error('Error fetching factories:', error);
            }
        };
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchData();
        fetchProductTypes();
        fetchSuppliers();
        fetchCategories();
        fetchVarieties();
    }, [selectedFactory]);

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

    const fetchProductTypes = async () => {
        try {
            // Fetch product types directly from API - filter only raw materials (codes starting with G)
            const response = await productTypeApi.getAll();
            if (response.data && response.data.data) {
                // Filter only raw material types (GKP, GKG, GKS, GBH)
                const rawMaterialCodes = ['GKP', 'GKG', 'GKS', 'GBH'];
                const rawMaterials = response.data.data.filter((pt: ProductType) =>
                    rawMaterialCodes.includes(pt.code)
                );
                setProductTypes(rawMaterials);
            }
        } catch (error) {
            logger.error("Failed to fetch product types", error);
            // Fallback to stock-based extraction if productTypeApi fails
            try {
                const response = await stockApi.getAll();
                if (response.data) {
                    const uniqueTypes = new Map();
                    response.data.forEach((stock: any) => {
                        if (stock.product_type && !uniqueTypes.has(stock.product_type.id)) {
                            uniqueTypes.set(stock.product_type.id, stock.product_type);
                        }
                    });
                    setProductTypes(Array.from(uniqueTypes.values()));
                }
            } catch (err) {
                logger.error("Fallback also failed", err);
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch StockMovements that are Raw Material Receipts
            const response = await api.get('/stock-movements');
            logger.log('API Response:', response.data);

            // API returns { data: [...], total: number }
            const movements = response.data?.data || response.data || [];
            logger.log('Movements array:', movements);

            if (movements && Array.isArray(movements)) {
                const filtered = movements.filter((m: any) => {
                    const isReceipt = m.reference_type === 'RAW_MATERIAL_RECEIPT' && m.movement_type === 'IN';
                    if (!isReceipt) return false;

                    const stock = m.Stock || m.otm_id_stock || m.stock;
                    const factoryId = stock?.id_factory || stock?.otm_id_factory?.id || m.id_factory;

                    // Use Number() to avoid string/number mismatch
                    if (selectedFactory && Number(factoryId) !== Number(selectedFactory)) return false;
                    return true;
                });
                logger.log('Filtered movements:', filtered);

                const receipts = filtered.map((m: any) => {
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
                logger.log('Receipts to display:', receipts);
                setBatches(receipts);
            }
        } catch (error) {
            logger.error("Error fetching batches:", error);
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
            // 1. Determine the correct product type based on selected category
            // Map category to product type (e.g., "Padi/Gabah" → GKP)
            const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId));

            // Find matching product type by category name/code
            const productTypesResponse = await productTypeApi.getAll();
            const allProductTypes = productTypesResponse.data?.data || productTypesResponse.data || [];

            // Try to match product type by category code or name
            let matchedProductType = allProductTypes.find((pt: any) =>
                pt.code === selectedCategory?.code ||
                pt.name === selectedCategory?.name
            );

            // Fallback: use GKP as default for raw material
            if (!matchedProductType) {
                matchedProductType = allProductTypes.find((pt: any) => pt.code === 'GKP');
            }

            // If still no product type, create GKP
            if (!matchedProductType) {
                const newTypeRes = await productTypeApi.create({
                    code: selectedCategory?.code || 'GKP',
                    name: selectedCategory?.name || 'Gabah Kering Panen',
                    unit: 'kg'
                });
                matchedProductType = newTypeRes.data?.data || newTypeRes.data;
            }

            // 2. Find or create stock for THIS factory + THIS product type
            const factoryId = selectedFactory;
            if (!factoryId) {
                showError("Error", "Pilih pabrik terlebih dahulu");
                setLoading(false);
                return;
            }

            // Search for existing stock matching factory + product type
            const stocksResponse = await stockApi.getAll({
                id_factory: factoryId,
                id_product_type: matchedProductType.id
            });
            const stocks = Array.isArray(stocksResponse.data) ? stocksResponse.data : stocksResponse.data?.data || [];

            // Filter to exact match (in case API doesn't filter precisely)
            let targetStock = stocks.find((s: any) =>
                s.id_factory === factoryId && s.id_product_type === matchedProductType.id
            );

            // If no matching stock exists, create one
            if (!targetStock) {
                const newStockRes = await api.post('/stocks', {
                    id_factory: factoryId,
                    id_product_type: matchedProductType.id,
                    quantity: 0,
                    unit: 'kg'
                });
                targetStock = newStockRes.data?.data || newStockRes.data;
            }

            // 2. Prepare payload
            const quantity = parseFloat(formData.netWeight);
            // Get supplier, category, variety names from IDs
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
                // UPDATE
                stockRes = await api.put(`/stock-movements/${editingId}`, payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil diperbarui!");
            } else {
                // CREATE
                stockRes = await api.post('/stock-movements', payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil disimpan!");
            }

            // Save/Update Quality Analysis (Optional: logic to link QA to Stock Movement stays same)
            // Note: If duplicated logic for QA exists, handle it. For now, we assume simple resubmission is okay or harmless.
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
                setFormData({ ...formData, supplierId: String(response.data.id) });
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
                setFormData({ ...formData, categoryId: String(response.data.id) });
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
                setFormData({ ...formData, varietyId: String(response.data.id) });
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
        setFormData({
            batchId: batch.batchId,
            poNumber: batch.poNumber,
            dateReceived: batch.dateReceived ? new Date(batch.dateReceived).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            supplierId: batch.supplierId || '',
            categoryId: batch.categoryId || '',
            varietyId: batch.varietyId || '',
            qualityGrade: batch.qualityGrade,
            moistureContent: String(batch.moistureContent),
            density: '', // Density might not be stored in batch root? It was in notes.
            netWeight: String(batch.netWeight),
            pricePerKg: String(batch.pricePerKg),
            otherCosts: String(batch.otherCosts || 0),
            notes: batch.notes
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrint = (batch: RawMaterialBatch) => {
        setPrintingBatch(batch);
        // Small delay to ensure printable element is rendered
        setTimeout(() => {
            const onAfterPrint = () => {
                setPrintingBatch(null);
                window.removeEventListener('afterprint', onAfterPrint);
            };
            window.addEventListener('afterprint', onAfterPrint);

            printElement('receipt-print', `Tanda Terima - ${batch.batchId}`);
        }, 500);
    };

    const selectedFactoryName = factories.find(f => f.id === selectedFactory)?.name;

    return (
        <>
            <Header title="Penerimaan Bahan Baku" subtitle={`Manage incoming raw material batches — ${selectedFactoryName || 'Semua Pabrik'}`} />

            <div className="page-content">
                {/* Factory Toggle */}
                <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedFactory(null)}
                    >
                        <span className="material-symbols-outlined icon-sm">apps</span>
                        Semua
                    </button>
                    {factories.map(factory => (
                        <button
                            key={factory.id}
                            className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedFactory(factory.id)}
                        >
                            <span className="material-symbols-outlined icon-sm">factory</span>
                            {factory.name}
                        </button>
                    ))}
                </div>

                {/* Form Card — hanya tampil jika factory dipilih */}
                {!selectedFactory && (
                    <div style={{
                        padding: '24px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#b45309'
                    }}>
                        <span className="material-symbols-outlined">info</span>
                        <span>Silakan pilih pabrik terlebih dahulu untuk menambah penerimaan bahan baku.</span>
                    </div>
                )}

                {selectedFactory && (
                    <div className="card mb-6">
                        <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>add_circle</span>
                                <h3 className="card-title">New Batch Entry</h3>
                            </div>
                            <span className="badge badge-default">Draft</span>
                        </div>

                        <div style={{ padding: 24 }}>
                            {/* Row 1 */}
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Batch ID</label>
                                    <div className="input-group">
                                        <div className="input-icon-wrapper">
                                            <span className="input-icon material-symbols-outlined">qr_code</span>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="BTC-2023-001"
                                                value={formData.batchId}
                                                onChange={e => setFormData({ ...formData, batchId: e.target.value })}
                                            />
                                        </div>
                                        <button className="btn btn-secondary" onClick={handleGenerateBatchId} title="Generate ID" style={{ padding: '0 12px' }}>
                                            <span className="material-symbols-outlined icon-sm">auto_awesome</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">PO Number</label>
                                    <div className="input-group">
                                        <span className="input-addon">
                                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="PO-88421"
                                            value={formData.poNumber}
                                            onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Date Received</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.dateReceived}
                                        onChange={e => setFormData({ ...formData, dateReceived: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Supplier</label>
                                    <div className="input-group">
                                        <span className="input-addon">
                                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_shipping</span>
                                        </span>
                                        <select
                                            className="form-input form-select"
                                            value={formData.supplierId}
                                            onChange={e => handleSupplierChange(e.target.value)}
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            <option value="__add_new__" style={{ fontWeight: 600, color: 'var(--primary)' }}>+ Tambah Supplier Baru</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid-3" style={{ marginBottom: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Kategori Bahan</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.categoryId}
                                        onChange={e => handleCategoryChange(e.target.value)}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                        <option value="__add_new__" style={{ fontWeight: 600, color: 'var(--primary)' }}>+ Tambah Kategori Baru</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Jenis / Varietas</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.varietyId}
                                        onChange={e => handleVarietyChange(e.target.value)}
                                    >
                                        <option value="">Pilih Jenis</option>
                                        {varieties.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                        <option value="__add_new__" style={{ fontWeight: 600, color: 'var(--primary)' }}>+ Tambah Varietas Baru</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Quality Analysis</label>
                                    {formData.qualityGrade === '-' || !formData.qualityGrade ? (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ width: '100%', border: '1px dashed var(--border-color)', height: 44, justifyContent: 'center' }}
                                            onClick={() => {
                                                if (!formData.varietyId) {
                                                    showWarning("Perhatian", "Pilih Varietas terlebih dahulu");
                                                    return;
                                                }
                                                setShowAnalysisModal(true);
                                            }}
                                        >
                                            <span className="material-symbols-outlined icon-sm">science</span>
                                            Perform Analysis
                                        </button>
                                    ) : (
                                        <div
                                            style={{
                                                display: 'flex', gap: 12, alignItems: 'center',
                                                background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                                                borderRadius: 8, padding: '8px 12px', cursor: 'pointer'
                                            }}
                                            onClick={() => setShowAnalysisModal(true)}
                                        >
                                            <div className={`badge ${formData.qualityGrade === 'KW 1' ? 'badge-success' :
                                                formData.qualityGrade === 'REJECT' ? 'badge-error' : 'badge-warning'
                                                }`}>
                                                {formData.qualityGrade}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                M: {formData.moistureContent}% | D: {formData.density} g/L
                                            </div>
                                            <span className="material-symbols-outlined icon-sm" style={{ marginLeft: 'auto' }}>edit</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 3 - Weight & Other */}
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Net Weight (Kg)</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="5000"
                                            value={formData.netWeight}
                                            onChange={e => setFormData({ ...formData, netWeight: e.target.value })}
                                        />
                                        <span className="input-addon">Kg</span>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Other Details / Notes</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Catatan..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Price per Kg</label>
                                    <div className="input-group">
                                        <span className="input-addon">Rp</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="5500"
                                            value={formData.pricePerKg}
                                            onChange={e => setFormData({ ...formData, pricePerKg: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Biaya Lain-lain</label>
                                    <div className="input-group">
                                        <span className="input-addon">Rp</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={formData.otherCosts}
                                            onChange={e => setFormData({ ...formData, otherCosts: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: File Upload & Save */}
                            <div className="grid-2-1" style={{ gap: 20 }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Surat Jalan / Tanda Terima</label>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setDeliveryNoteFile(e.target.files[0]);
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                            id="delivery-note-upload"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ flex: '0 0 auto' }}
                                        >
                                            <span className="material-symbols-outlined icon-sm">upload_file</span>
                                            Upload File
                                        </button>
                                        {deliveryNoteFile && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '8px 12px',
                                                background: 'var(--bg-elevated)',
                                                borderRadius: 'var(--border-radius-sm)',
                                                flex: 1,
                                                minWidth: 0
                                            }}>
                                                <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18 }}>
                                                    check_circle
                                                </span>
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {deliveryNoteFile.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => {
                                                        setDeliveryNoteFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    style={{ marginLeft: 'auto', padding: 4 }}
                                                >
                                                    <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>close</span>
                                                </button>
                                            </div>
                                        )}
                                        {!deliveryNoteFile && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                Format: JPG, PNG, PDF (Max 5MB)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                                    {editingId && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
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
                                            }}
                                            disabled={loading}
                                            style={{ height: 44 }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ width: '100%', height: 44 }}>
                                        <span className="material-symbols-outlined icon-sm">save</span>
                                        {editingId ? 'Update Entry' : 'Save Entry'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* List Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Received Batches</h3>
                        <div className="search-box">
                            <span className="material-symbols-outlined search-icon">search</span>
                            <input type="text" placeholder="Search batch..." className="search-input" />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>BATCH ID</th>
                                    <th>DATE</th>
                                    <th>SUPPLIER</th>
                                    <th className="hide-mobile">MATERIAL</th>
                                    <th className="hide-mobile">GRADE</th>
                                    <th>NET WEIGHT</th>
                                    <th className="hide-mobile">MOISTURE</th>
                                    <th className="hide-mobile">LOCATION</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} align="center" style={{ padding: 40, color: 'var(--text-secondary)' }}>
                                            No raw material receipts found. Use the form above to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    batches.map(batch => (
                                        <tr key={batch.id}>
                                            <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{batch.batchId}</td>
                                            <td>{formatDate(batch.dateReceived)}</td>
                                            <td>{batch.supplier}</td>
                                            <td className="hide-mobile">
                                                <span className={`badge ${batch.materialType.includes('GKP') ? 'badge-success' :
                                                    batch.materialType.includes('Kering') ? 'badge-warning' : 'badge-default'
                                                    }`}>
                                                    {batch.materialType}
                                                </span>
                                            </td>
                                            <td className="hide-mobile">{batch.qualityGrade}</td>
                                            <td style={{ fontWeight: 600 }}>{formatNumber(batch.netWeight)} Kg</td>
                                            <td className="hide-mobile">{batch.moistureContent}%</td>
                                            <td className="hide-mobile">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span className="material-symbols-outlined icon-xs" style={{ color: 'var(--text-muted)' }}>factory</span>
                                                    <span className="badge badge-default" style={{ fontWeight: 500 }}>{batch.factoryName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        title="Run Quality Analysis"
                                                        onClick={() => {
                                                            setSelectedBatchForAnalysis(batch);
                                                            setShowAnalysisModal(true);
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>science</span>
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        title="Print Tanda Terima"
                                                        onClick={() => handlePrint(batch)}
                                                    >
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--info)' }}>print</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(batch)}>
                                                        <span className="material-symbols-outlined icon-sm">edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(batch.id)} style={{ color: 'var(--error)' }}>
                                                        <span className="material-symbols-outlined icon-sm">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {showAnalysisModal && (
                <QualityAnalysisModal
                    batchId={selectedBatchForAnalysis?.batchId || formData.batchId}
                    stockMovementId={selectedBatchForAnalysis?.id}
                    varietyId={formData.varietyId}
                    varietyName={varieties.find(v => String(v.id) === formData.varietyId)?.name}
                    initialData={{
                        moisture: formData.moistureContent,
                        density: formData.density,
                        grade: formData.qualityGrade
                    }}
                    onClose={() => {
                        setShowAnalysisModal(false);
                        setSelectedBatchForAnalysis(null);
                    }}
                    onSave={handleAnalysisSave}
                />
            )}

            {showAddSupplierModal && (
                <div className="modal-overlay" onClick={() => setShowAddSupplierModal(false)} style={{ zIndex: 1000 }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Tambah Supplier Baru</h3>
                            <button className="modal-close" onClick={() => setShowAddSupplierModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Kode Supplier *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="SUP-001"
                                    value={newSupplier.code}
                                    onChange={e => setNewSupplier({ ...newSupplier, code: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Supplier *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="PT. Nama Supplier"
                                    value={newSupplier.name}
                                    onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Person</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nama kontak"
                                    value={newSupplier.contact_person}
                                    onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">No. Telepon</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="08123456789"
                                    value={newSupplier.phone}
                                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddSupplierModal(false)}>
                                Batal
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveNewSupplier} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">save</span>
                                Simpan Supplier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Kategori */}
            {showAddCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowAddCategoryModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>Tambah Kategori Baru</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddCategoryModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Kode Kategori *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="PADI, PK, GLOSOR"
                                    value={newCategory.code}
                                    onChange={e => setNewCategory({ ...newCategory, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Kategori *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Padi/Gabah"
                                    value={newCategory.name}
                                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Deskripsi</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Deskripsi kategori..."
                                    value={newCategory.description}
                                    onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>
                                Batal
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveNewCategory} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">save</span>
                                Simpan Kategori
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Varietas */}
            {showAddVarietyModal && (
                <div className="modal-overlay" onClick={() => setShowAddVarietyModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>Tambah Varietas Baru</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAddVarietyModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Kode Varietas *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="IR64, KEBO, KETAN"
                                    value={newVariety.code}
                                    onChange={e => setNewVariety({ ...newVariety, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Varietas *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="IR 64"
                                    value={newVariety.name}
                                    onChange={e => setNewVariety({ ...newVariety, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Deskripsi</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Deskripsi varietas..."
                                    value={newVariety.description}
                                    onChange={e => setNewVariety({ ...newVariety, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddVarietyModal(false)}>
                                Batal
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveNewVariety} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">save</span>
                                Simpan Varietas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Printable Receipt — hidden on screen, only visible during print ===== */}
            {printingBatch && (
                <div id="receipt-print" className="print-receipt">
                    {/* Header Perusahaan */}
                    <div className="receipt-header">
                        <h2>PT. Pangan Masa Depan</h2>
                        <h3>Tanda Terima Penerimaan Bahan Baku</h3>
                    </div>

                    {/* Info Batch */}
                    <table className="receipt-info">
                        <tbody>
                            <tr>
                                <td className="receipt-label">No. Batch</td>
                                <td>: {printingBatch.batchId}</td>
                            </tr>
                            <tr>
                                <td className="receipt-label">No. PO</td>
                                <td>: {printingBatch.poNumber || '-'}</td>
                            </tr>
                            <tr>
                                <td className="receipt-label">Tanggal Terima</td>
                                <td>: {formatDate(printingBatch.dateReceived)}</td>
                            </tr>
                            <tr>
                                <td className="receipt-label">Supplier</td>
                                <td>: {printingBatch.supplier}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Tabel Detail Bahan */}
                    <h4 style={{ marginBottom: 8 }}>Detail Bahan</h4>
                    <table className="receipt-detail-table">
                        <thead>
                            <tr>
                                <th>Jenis Bahan</th>
                                <th>Grade Kualitas</th>
                                <th>Kadar Air</th>
                                <th>Berat Bersih</th>
                                <th>Harga/Kg</th>
                                <th>Total Harga</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{printingBatch.materialType}</td>
                                <td>{printingBatch.qualityGrade}</td>
                                <td>{printingBatch.moistureContent}%</td>
                                <td>{formatNumber(printingBatch.netWeight)} Kg</td>
                                <td>Rp {formatNumber(printingBatch.pricePerKg)}</td>
                                <td>Rp {formatNumber(printingBatch.netWeight * printingBatch.pricePerKg)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Catatan */}
                    {printingBatch.notes && (
                        <div className="receipt-notes">
                            <strong>Catatan:</strong> {printingBatch.notes}
                        </div>
                    )}

                    {/* Kolom Tanda Tangan */}
                    <div className="receipt-signatures">
                        <div className="signature-box">
                            <p>Pengirim / Supplier</p>
                            <div className="signature-line"></div>
                            <p>({printingBatch.supplier})</p>
                        </div>
                        <div className="signature-box">
                            <p>Penerima</p>
                            <div className="signature-line"></div>
                            <p>(________________)</p>
                        </div>
                        <div className="signature-box">
                            <p>Mengetahui</p>
                            <div className="signature-line"></div>
                            <p>(________________)</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="receipt-footer">
                        <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default RawMaterialReceipt;
