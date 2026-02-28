import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import QualityAnalysisModal from '../../components/Production/QualityAnalysisModal';
import PaymentModal from '../../components/Production/PaymentModal';
import api, { supplierApi, productTypeApi, rawMaterialCategoryApi, riceVarietyApi, materialReceiptApi, purchaseOrderApi } from '../../services/api';
import { formatDate, formatNumber, formatCurrency } from '../../utils/formatUtils';
import { printElement } from '../../utils/printUtils';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import LogoLoader from '../../components/UI/LogoLoader';

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
    density: number;
    greenPercentage: number;
    yellowPercentage: number;
    netWeight: number;
    pricePerKg: number;
    otherCosts: number;
    emptyWeight: number;
    notes: string;
    deliveryNoteUrl?: string; // Surat Jalan
    receiptUrl?: string;      // Tanda Terima
    createdAt: string;
    supplierId?: string;
    categoryId?: string;
    varietyId?: string;
    factoryName?: string;
    status: 'WAITING_APPROVAL' | 'APPROVED' | 'PAID';
    approvedBy?: string;
    approvedAt?: string;
    paidAt?: string;
    paymentReference?: string;
    paymentMethod?: string;
    receiptNumber: string;
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
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);

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

    // File Upload State
    const [suratJalanFile, setSuratJalanFile] = useState<File | null>(null);
    const [tandaTerimaFile, setTandaTerimaFile] = useState<File | null>(null);

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
        greenPercentage: '',
        yellowPercentage: '',
        netWeight: '',
        pricePerKg: '',
        otherCosts: '0',
        emptyWeight: '0',
        notes: ''
    });

    const handleAnalysisSave = (data: any) => {
        setFormData({
            ...formData,
            moistureContent: data.moisture,
            density: data.density,
            greenPercentage: data.greenPercentage,
            yellowPercentage: data.yellowPercentage ?? '',
            qualityGrade: data.qualityGrade,
        });
        setShowAnalysisModal(false);
    };

    // PO State & Fetching
    const [linkedPO, setLinkedPO] = useState<any>(null);
    const [poItems, setPoItems] = useState<any[]>([]);
    const [fetchingPO, setFetchingPO] = useState(false);
    const [selectedPoItemId, setSelectedPoItemId] = useState<number | null>(null);

    const handlePoChange = async (poNumStr: string) => {
        setFormData(f => ({ ...f, poNumber: poNumStr, supplierId: '' }));
        setSelectedPoItemId(null);

        if (!poNumStr) {
            setLinkedPO(null);
            setPoItems([]);
            return;
        }

        setFetchingPO(true);
        try {
            const foundPO = activePOs.find((p: any) => p.po_number === poNumStr);
            let targetPoId = foundPO?.id;

            if (!targetPoId) {
                // Fallback for manual or unseen POs
                const pRes = await purchaseOrderApi.getAll({ search: poNumStr });
                const pos = pRes.data?.data || pRes.data || [];
                const fallbackPO = pos.find((p: any) => p.po_number === poNumStr);
                if (!fallbackPO) {
                    showWarning("Tidak Ditemukan", "PO dengan nomor tersebut tidak ditemukan");
                    return;
                }
                targetPoId = fallbackPO.id;
            }

            // Fetch receivable items
            const itemsRes = await purchaseOrderApi.getReceivableItems(targetPoId);
            const { po, receivableItems } = itemsRes.data?.data || itemsRes.data;

            if (receivableItems.length === 0) {
                showWarning("PO Selesai", "Semua item pada PO ini sudah diterima sepenuhnya.");
                return;
            }

            setLinkedPO(po);
            setPoItems(receivableItems);

            // Auto-fill form if PO has supplier
            if (po.Supplier) {
                setFormData(f => ({ ...f, poNumber: poNumStr, supplierId: String(po.Supplier.id) }));
            }
            showSuccess("PO Ditemukan", `${receivableItems.length} item PO siap diterima.`);

        } catch (error: any) {
            logger.error("Error fetching PO limits:", error);
            showError("Gagal", "Kesalahan mengambil data PO");
        } finally {
            setFetchingPO(false);
        }
    };

    const handlePoItemSelect = (itemIdStr: string) => {
        if (!itemIdStr) {
            setSelectedPoItemId(null);
            return;
        }
        const itemId = parseInt(itemIdStr);
        setSelectedPoItemId(itemId);

        const item = poItems.find(i => i.id === itemId);
        if (item) {
            // Fill varieties, net weight safely, pricing
            setFormData(f => ({
                ...f,
                pricePerKg: String(item.unit_price),
                netWeight: String(item.remaining_quantity), // Max remaining as default suggestion
                varietyId: item.ProductType?.id_variety ? String(item.ProductType.id_variety) : f.varietyId
            }));
        }
    };

    useEffect(() => {
        if (!factoryLoading) {
            fetchData();
            if (selectedFactory) {
                fetchActivePOs(selectedFactory);
            } else {
                setActivePOs([]);
            }
        }
    }, [selectedFactory, page, factoryLoading, statusFilter]);

    useEffect(() => {
        fetchSuppliers();
        fetchCategories();
        fetchVarieties();
    }, []);

    const [activePOs, setActivePOs] = useState<any[]>([]);

    const fetchActivePOs = async (factoryId: number) => {
        try {
            const res = await purchaseOrderApi.getAll({
                id_factory: factoryId,
                status: 'APPROVED,SENT,PARTIAL_RECEIVED', // We might need to ensure backend handles this status string or we fetch and filter
                limit: 100
            });
            const pos = res.data?.data || res.data || [];
            setActivePOs(pos.filter((po: any) => ['APPROVED', 'SENT', 'PARTIAL_RECEIVED'].includes(po.status)));
        } catch (error) {
            logger.error("Failed to fetch active POs", error);
        }
    };

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
            const response = await riceVarietyApi.getAll();
            if (response.data) {
                setVarieties(response.data.data || response.data);
            }
        } catch (error) {
            logger.error("Failed to fetch varieties", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await materialReceiptApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined,
                status: statusFilter || undefined
            });

            const receiptsData = response.data?.data || response.data || [];
            const total = response.data?.count || receiptsData.length;

            if (receiptsData && Array.isArray(receiptsData)) {
                const receipts = receiptsData.map((m: any) => {
                    const qa = (m.StockMovement?.RawMaterialQualityAnalysis && m.StockMovement.RawMaterialQualityAnalysis.length > 0)
                        ? m.StockMovement.RawMaterialQualityAnalysis[0]
                        : {};

                    return {
                        id: m.id,
                        batchId: m.batch_code,
                        poNumber: (m as any).PurchaseOrder?.po_number || '-',
                        dateReceived: m.receipt_date || m.created_at,
                        supplier: m.Supplier?.name || 'Unknown',
                        supplierId: String(m.id_supplier),
                        materialType: m.ProductType?.name || 'Unknown',
                        categoryId: '',
                        varietyId: String(m.id_variety) || '',
                        qualityGrade: qa.final_grade || '-',
                        moistureContent: qa.moisture_value || 0,
                        density: qa.density_value || 0,
                        greenPercentage: qa.green_percentage || 0,
                        yellowPercentage: qa.yellow_percentage || 0,
                        netWeight: m.quantity,
                        pricePerKg: m.unit_price,
                        otherCosts: m.other_costs,
                        emptyWeight: 0,
                        notes: m.notes || '',
                        deliveryNoteUrl: m.delivery_note_url || '',
                        receiptUrl: m.receipt_url || '',
                        factoryName: m.Factory?.name || 'Unknown',
                        createdAt: m.created_at,
                        status: m.status,
                        approvedBy: m.Approver?.fullname,
                        approvedAt: m.approved_at,
                        paidAt: m.paid_at,
                        paymentReference: m.payment_reference,
                        paymentMethod: m.payment_method,
                        receiptNumber: m.receipt_number
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

    // Check if all required fields are filled to enable batch generation
    const isFormReadyForBatch = !!(selectedFactory && formData.supplierId && formData.varietyId && formData.netWeight && parseFloat(formData.netWeight) > 0 && formData.pricePerKg && parseFloat(formData.pricePerKg) > 0 && formData.dateReceived);

    // Filter varieties by category RAW_MATERIAL logic (simplifying here since it's just ID based)

    const [generatingBatch, setGeneratingBatch] = useState(false);

    const handleGenerateBatchId = async () => {
        if (!isFormReadyForBatch) {
            showWarning('Perhatian', 'Harap lengkapi semua data terlebih dahulu sebelum generate Batch ID');
            return;
        }

        setGeneratingBatch(true);
        try {
            // Find the factory code
            const factory = factories.find(f => f.id === selectedFactory);
            if (!factory) {
                showError('Error', 'Pabrik tidak ditemukan');
                return;
            }

            // Find product type matching RAW_MATERIAL + variety
            const productTypesResponse = await api.get('/product-types', {
                params: { category: 'RAW_MATERIAL', id_variety: formData.varietyId }
            });
            const filteredTypes = productTypesResponse.data?.data || productTypesResponse.data || [];
            let matchedProductType = filteredTypes.length > 0 ? filteredTypes[0] : null;

            if (!matchedProductType) {
                // Fallback: find any raw material product type
                const allRes = await productTypeApi.getAll();
                const all = allRes.data?.data || allRes.data || [];
                matchedProductType = all.find((pt: any) => pt.category === 'RAW_MATERIAL');
            }

            if (!matchedProductType) {
                showError('Error', 'Tidak ditemukan Product Type untuk varietas ini');
                return;
            }

            // Call backend batch code generation API
            const response = await api.post('/batch-code/generate', {
                factoryCode: factory.code,
                productTypeId: matchedProductType.id,
                date: formData.dateReceived
            });

            const batchCode = response.data?.batchCode;
            if (batchCode) {
                setFormData(prev => ({ ...prev, batchId: batchCode }));
                showSuccess('Berhasil', `Batch ID berhasil digenerate: ${batchCode}`);
            } else {
                showError('Error', 'Gagal mendapatkan batch code dari server');
            }
        } catch (error: any) {
            logger.error('Failed to generate batch code:', error);
            showError('Gagal', error.response?.data?.error || error.message || 'Gagal generate Batch ID');
        } finally {
            setGeneratingBatch(false);
        }
    };

    const handleSave = async () => {
        if (!selectedFactory) {
            showError("Validasi", "Pilih pabrik tujuan terlebih dahulu");
            return;
        }

        if (!formData.batchId || !formData.netWeight || !formData.supplierId) {
            showError("Validasi", "Harap lengkapi field yang wajib (Batch ID, Supplier, Berat Netto)");
            return;
        }

        setLoading(true);
        try {
            // --- Helper: File Upload ---
            const uploadFile = async (file: File, type: string) => {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                const res = await api.post(`/upload?type=${type}`, uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data.url;
            };

            let deliveryNoteUrl = '';
            let receiptUrl = '';

            if (suratJalanFile) {
                deliveryNoteUrl = await uploadFile(suratJalanFile, 'surat-jalan');
            }
            if (tandaTerimaFile) {
                receiptUrl = await uploadFile(tandaTerimaFile, 'tanda-terima');
            }

            const selectedVariety = varieties.find(v => v.id === parseInt(formData.varietyId));
            const categoryCode = 'RAW_MATERIAL';

            // Find product type that matches RAW_MATERIAL category and this variety
            const productTypesResponse = await api.get('/product-types', {
                params: { category: categoryCode, id_variety: formData.varietyId }
            });
            const filteredTypes = productTypesResponse.data?.data || productTypesResponse.data || [];

            let matchedProductType = filteredTypes.length > 0 ? filteredTypes[0] : null;

            if (!matchedProductType) {
                // If not found, try to find a general one or create
                const allRes = await productTypeApi.getAll();
                const all = allRes.data?.data || allRes.data || [];
                matchedProductType = all.find((pt: any) => pt.code === 'GKP' || pt.code === 'GABA');

                if (!matchedProductType) {
                    const newTypeRes = await productTypeApi.create({
                        code: `GABA-${selectedVariety?.code || 'GENERIC'}`,
                        name: `Gabah ${selectedVariety?.name || 'Generic'}`,
                        category: categoryCode,
                        id_variety: parseInt(formData.varietyId),
                        unit: 'kg'
                    });
                    matchedProductType = newTypeRes.data?.data || newTypeRes.data;
                }
            }

            const payload = {
                id_supplier: parseInt(formData.supplierId),
                id_factory: selectedFactory,
                id_product_type: matchedProductType.id,
                id_variety: formData.varietyId ? parseInt(formData.varietyId) : undefined,
                receipt_date: formData.dateReceived,
                batch_code: formData.batchId,
                quantity: parseFloat(formData.netWeight),
                unit_price: parseFloat(formData.pricePerKg),
                other_costs: parseFloat(formData.otherCosts || '0'),
                delivery_note_url: deliveryNoteUrl || (editingId ? batches.find((b: any) => b.id === editingId)?.deliveryNoteUrl : undefined),
                receipt_url: receiptUrl || (editingId ? batches.find((b: any) => b.id === editingId)?.receiptUrl : undefined),
                notes: formData.notes,
                moisture_value: !isNaN(parseFloat(formData.moistureContent)) ? parseFloat(formData.moistureContent) : undefined,
                density_value: !isNaN(parseFloat(formData.density)) ? parseFloat(formData.density) : undefined,
                green_percentage: !isNaN(parseFloat(formData.greenPercentage)) ? parseFloat(formData.greenPercentage) : undefined,
                yellow_percentage: !isNaN(parseFloat(formData.yellowPercentage)) ? parseFloat(formData.yellowPercentage) : undefined,
                quality_grade: formData.qualityGrade !== '-' ? formData.qualityGrade : undefined,
                id_purchase_order: linkedPO ? linkedPO.id : undefined,
                id_purchase_order_item: selectedPoItemId || undefined,
            };

            if (editingId) {
                await materialReceiptApi.update(editingId, payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil diperbarui!");
            } else {
                await materialReceiptApi.create(payload);
                showSuccess("Berhasil", "Penerimaan Bahan Baku berhasil disimpan!");
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
                greenPercentage: '',
                yellowPercentage: '',
                netWeight: '',
                pricePerKg: '',
                otherCosts: '0',
                emptyWeight: '0',
                notes: ''
            });
            setSuratJalanFile(null);
            setTandaTerimaFile(null);
            setLinkedPO(null);
            setPoItems([]);
            setSelectedPoItemId(null);
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
            const response = await riceVarietyApi.create(newVariety);
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
            density: String(batch.density || ''),
            greenPercentage: String(batch.greenPercentage || ''),
            yellowPercentage: String(batch.yellowPercentage || ''),
            netWeight: String(batch.netWeight),
            pricePerKg: String(batch.pricePerKg),
            otherCosts: String(batch.otherCosts || 0),
            emptyWeight: String(batch.emptyWeight || 0),
            notes: batch.notes
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    const handleDownloadPdf = async (batch: RawMaterialBatch) => {
        try {
            const response = await materialReceiptApi.downloadPdf(batch.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${batch.receiptNumber || batch.batchId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showError('Error', 'Gagal download PDF');
        }
    };

    const handleApprove = async (id: number) => {
        if (!window.confirm('Approve penerimaan bahan baku ini? Stock akan ditambahkan.')) return;
        setLoading(true);
        try {
            await materialReceiptApi.approve(id);
            showSuccess('Berhasil', 'Penerimaan berhasil di-approve');
            fetchData();
        } catch (error: any) {
            showError('Gagal', error.response?.data?.error?.message || 'Gagal approve penerimaan');
        } finally {
            setLoading(false);
        }
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
                        <div className="grid-3" style={{ marginBottom: 20 }}>
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
                                    <option value="">Pilih Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    <option value="__add_new__" style={{ color: 'var(--primary)' }}>+ Tambah Supplier Baru</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    PO Number
                                    {fetchingPO && <span className="material-symbols-outlined icon-sm" style={{ animation: 'spin 1s linear infinite' }}>sync</span>}
                                </label>
                                <select
                                    className="form-input form-select"
                                    value={formData.poNumber}
                                    onChange={e => handlePoChange(e.target.value)}
                                    disabled={fetchingPO}
                                >
                                    <option value="">-- Pilih PO (Opsional) --</option>
                                    {activePOs.map((po: any) => (
                                        <option key={po.id} value={po.po_number}>
                                            {po.po_number} - {po.Supplier?.name || 'General (Umum)'} ({new Date(po.order_date).toLocaleDateString('id-ID')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {poItems.length > 0 && (
                            <div className="card mb-4" style={{ backgroundColor: 'var(--surface-hover)', padding: '16px', border: '1px solid var(--border)' }}>
                                <label className="form-label" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="material-symbols-outlined icon-sm">receipt_long</span>
                                    Item PO yang Tersedia
                                </label>
                                <select
                                    className="form-input form-select"
                                    value={selectedPoItemId || ''}
                                    onChange={(e) => handlePoItemSelect(e.target.value)}
                                >
                                    <option value="">-- Pilih Item dari PO {linkedPO?.po_number} --</option>
                                    {poItems.map((item: any) => (
                                        <option key={item.id} value={item.id}>
                                            {item.ProductType?.name} - Sisa: {item.remaining_quantity} {item.ProductType?.unit || 'kg'} (Harga: {formatCurrency(item.unit_price)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

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

                        <div className="grid-3" style={{ marginBottom: 20 }}>
                            <div className="form-group">
                                <label className="form-label">Berat Netto (Kg)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.netWeight}
                                        onChange={e => {
                                            // Optional: warn if value exceeds selected PO item remaining
                                            setFormData({ ...formData, netWeight: e.target.value });
                                        }}
                                        placeholder="0"
                                    />
                                    <span className="input-addon">Kg</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Kg Hampa</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.emptyWeight}
                                        onChange={e => setFormData({ ...formData, emptyWeight: e.target.value })}
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
                        </div>

                        <div className="grid-2" style={{ marginBottom: 20 }}>
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

                        {/* File Upload Section */}
                        <div className="grid-2 mb-4" style={{ gap: '1.5rem', marginTop: '0.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="material-symbols-outlined icon-sm">upload_file</span>
                                    Surat Jalan
                                </label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept="image/*,application/pdf"
                                    onChange={e => setSuratJalanFile(e.target.files?.[0] || null)}
                                />
                                {suratJalanFile && <small className="text-success">File terpilih: {suratJalanFile.name}</small>}
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span className="material-symbols-outlined icon-sm">upload_file</span>
                                    Tanda Terima
                                </label>
                                <input
                                    type="file"
                                    className="form-input"
                                    accept="image/*,application/pdf"
                                    onChange={e => setTandaTerimaFile(e.target.files?.[0] || null)}
                                />
                                {tandaTerimaFile && <small className="text-success">File terpilih: {tandaTerimaFile.name}</small>}
                            </div>
                        </div>

                        {/* Batch ID Generation — last step */}
                        <div style={{
                            padding: '16px 20px',
                            background: formData.batchId
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)'
                                : isFormReadyForBatch
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)'
                                    : 'rgba(148, 163, 184, 0.06)',
                            borderRadius: 12,
                            border: formData.batchId
                                ? '1.5px solid rgba(16, 185, 129, 0.3)'
                                : isFormReadyForBatch
                                    ? '1.5px dashed rgba(59, 130, 246, 0.4)'
                                    : '1.5px dashed rgba(148, 163, 184, 0.3)',
                            marginBottom: 20,
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: 20,
                                            color: formData.batchId ? 'var(--success)' : isFormReadyForBatch ? 'var(--primary)' : 'var(--text-muted)'
                                        }}>
                                            {formData.batchId ? 'check_circle' : 'qr_code_2'}
                                        </span>
                                        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Batch ID</label>
                                    </div>
                                    {formData.batchId ? (
                                        <div style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            fontFamily: 'monospace',
                                            color: 'var(--success)',
                                            letterSpacing: 1
                                        }}>
                                            {formData.batchId}
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {isFormReadyForBatch
                                                ? 'Semua data sudah terisi. Klik tombol untuk generate Batch ID otomatis.'
                                                : 'Lengkapi semua field di atas terlebih dahulu untuk generate Batch ID.'}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {formData.batchId && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setFormData(prev => ({ ...prev, batchId: '' }))}
                                            title="Reset Batch ID"
                                        >
                                            <span className="material-symbols-outlined icon-sm">refresh</span>
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        className={`btn ${formData.batchId ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                        onClick={handleGenerateBatchId}
                                        disabled={!isFormReadyForBatch || generatingBatch}
                                        style={{
                                            opacity: isFormReadyForBatch ? 1 : 0.5,
                                            cursor: isFormReadyForBatch ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {generatingBatch ? (
                                            <><span className="material-symbols-outlined icon-sm" style={{ animation: 'spin 1s linear infinite' }}>sync</span> Generating...</>
                                        ) : (
                                            <><span className="material-symbols-outlined icon-sm">auto_awesome</span> {formData.batchId ? 'Re-generate' : 'Generate Batch ID'}</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            {editingId && (
                                <button className="btn btn-secondary" onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        batchId: '', poNumber: '', dateReceived: new Date().toISOString().split('T')[0],
                                        supplierId: '', categoryId: '', varietyId: '', qualityGrade: '-',
                                        moistureContent: '', density: '', greenPercentage: '', yellowPercentage: '', netWeight: '', emptyWeight: '0', pricePerKg: '',
                                        otherCosts: '0', notes: ''
                                    });
                                }}>Batal Edit</button>
                            )}
                            <button className="btn btn-primary" onClick={handleSave} disabled={loading || !formData.batchId}>
                                <span className="material-symbols-outlined icon-sm">save</span>
                                {editingId ? 'Simpan Perubahan' : 'Catat Penerimaan'}
                            </button>
                        </div>
                    </div>
                </div >
            ) : (
                <div style={{ padding: 24, textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, marginBottom: 24 }}>
                    <p style={{ color: '#b45309' }}>Silakan pilih pabrik terlebih dahulu untuk menambah data penerimaan.</p>
                </div>
            )}

            {/* List Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Riwayat Penerimaan</h3>
                    <select className="form-input form-select" style={{ width: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">Semua Status</option>
                        <option value="WAITING_APPROVAL">Menunggu Approval</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="PAID">Lunas</option>
                    </select>
                </div>

                {loading && batches.length === 0 ? (
                    <LogoLoader small text="Memuat data penerimaan..." />
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
                                        <th>Hampa</th>
                                        <th>Total Biaya</th>
                                        <th>Status</th>
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
                                            <td><span className="font-mono" style={{ color: batch.emptyWeight > 0 ? '#dc2626' : 'inherit' }}>{formatNumber(batch.emptyWeight)}</span> kg</td>
                                            <td><span className="font-mono">{formatCurrency(batch.netWeight * batch.pricePerKg + Number(batch.otherCosts))}</span></td>
                                            <td>
                                                <span className={`badge ${batch.status === 'WAITING_APPROVAL' ? 'badge-warning' :
                                                    batch.status === 'APPROVED' ? 'badge-success' :
                                                        'badge-info'
                                                    }`}>
                                                    {batch.status === 'WAITING_APPROVAL' ? 'Menunggu Approval' :
                                                        batch.status === 'APPROVED' ? 'Disetujui' : 'Lunas'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 4 }}>
                                                    {batch.deliveryNoteUrl && (
                                                        <a
                                                            href={`${api.defaults.baseURL}${batch.deliveryNoteUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            title="Lihat Surat Jalan"
                                                        >
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>description</span>
                                                        </a>
                                                    )}
                                                    {batch.receiptUrl && (
                                                        <a
                                                            href={`${api.defaults.baseURL}${batch.receiptUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            title="Lihat Tanda Terima"
                                                        >
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--success)' }}>receipt_long</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(batch)} title="Download PDF Resmi">
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>picture_as_pdf</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(batch)} title="Cetak Label/Slip Internal">
                                                        <span className="material-symbols-outlined icon-sm">print</span>
                                                    </button>

                                                    {batch.status === 'WAITING_APPROVAL' && user && ['MANAGER', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleApprove(batch.id)} title="Approve">
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--success)' }}>check_circle</span>
                                                        </button>
                                                    )}

                                                    {batch.status === 'APPROVED' && user && ['ACCOUNTING', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowPaymentModal(batch.id)} title="Catat Pembayaran">
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--info)' }}>payments</span>
                                                        </button>
                                                    )}

                                                    {batch.status === 'WAITING_APPROVAL' && (
                                                        <>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(batch)}>
                                                                <span className="material-symbols-outlined icon-sm">edit</span>
                                                            </button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(batch.id)}>
                                                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                            onPageChange={setPage}
                            totalItems={totalItems}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </>
                )}
            </div>

            {/* Modals */}

            {showPaymentModal && (
                <PaymentModal
                    receiptId={showPaymentModal}
                    onClose={() => setShowPaymentModal(null)}
                    onSuccess={fetchData}
                />
            )}

            {
                showAnalysisModal && (
                    <QualityAnalysisModal
                        batchId={formData.batchId}
                        onClose={() => setShowAnalysisModal(false)}
                        onSave={handleAnalysisSave}
                    />
                )
            }

            {/* Add Modals (Simplified for context) */}
            {
                showAddSupplierModal && (
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
                )
            }
            {
                showAddCategoryModal && (
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
                )
            }

            {
                showAddVarietyModal && (
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
                )
            }

            {/* Print Container (Hidden on screen) */}
            {
                printingBatch && (
                    <div id="receipt-print" className="print-receipt print-visible">
                        {/* Kop Surat / Letterhead */}
                        <div className="receipt-letterhead">
                            <div className="receipt-logo-section">
                                <img src="/pmd_logo.png" alt="PMD Logo" className="receipt-logo" />
                            </div>
                            <div className="receipt-company-section">
                                <h2 className="receipt-company-name">PT PANGAN MASA DEPAN</h2>
                                <p className="receipt-company-tagline">Solusi Pangan Berkualitas untuk Indonesia</p>
                            </div>
                            <div className="receipt-doc-id">
                                <span className="receipt-doc-label">No. Dokumen</span>
                                <span className="receipt-doc-value">{printingBatch.batchId}</span>
                            </div>
                        </div>

                        {/* Judul Dokumen */}
                        <div className="receipt-title-bar">
                            <h3>TANDA TERIMA PENERIMAAN BAHAN BAKU</h3>
                        </div>

                        {/* Info Batch - 2 kolom */}
                        <div className="receipt-info-grid">
                            <div className="receipt-info-col">
                                <table className="receipt-info">
                                    <tbody>
                                        <tr>
                                            <td className="receipt-label">No. Batch</td>
                                            <td>: <strong>{printingBatch.batchId}</strong></td>
                                        </tr>
                                        <tr>
                                            <td className="receipt-label">No. PO</td>
                                            <td>: {printingBatch.poNumber || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td className="receipt-label">Supplier</td>
                                            <td>: {printingBatch.supplier}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="receipt-info-col">
                                <table className="receipt-info">
                                    <tbody>
                                        <tr>
                                            <td className="receipt-label">Tanggal Terima</td>
                                            <td>: {formatDate(printingBatch.dateReceived)}</td>
                                        </tr>
                                        <tr>
                                            <td className="receipt-label">Pabrik</td>
                                            <td>: {printingBatch.factoryName || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabel Detail Bahan */}
                        <table className="receipt-detail-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>No</th>
                                    <th style={{ width: '20%' }}>Jenis / Varietas</th>
                                    <th style={{ width: '12%' }}>Grade</th>
                                    <th style={{ width: '10%' }}>KA (%)</th>
                                    <th style={{ width: '15%' }}>Bruto (kg)</th>
                                    <th style={{ width: '15%' }}>Tara (kg)</th>
                                    <th style={{ width: '15%' }}>Netto (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'center' }}>1</td>
                                    <td>{printingBatch.materialType}</td>
                                    <td>{printingBatch.qualityGrade}</td>
                                    <td style={{ textAlign: 'center' }}>{printingBatch.moistureContent}%</td>
                                    <td style={{ textAlign: 'right' }}>{formatNumber(printingBatch.netWeight + (printingBatch.emptyWeight || 0))}</td>
                                    <td style={{ textAlign: 'right' }}>{formatNumber(printingBatch.emptyWeight || 0)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(printingBatch.netWeight)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Total Berat Bersih :</td>
                                    <td colSpan={3} style={{ fontWeight: 'bold', fontSize: '11pt' }}>{formatNumber(printingBatch.netWeight)} kg</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Quality Parameters Analysis - Industrial Style */}
                        <div className="receipt-analysis-container" style={{ marginTop: '15px' }}>
                            <div style={{ border: '2px solid #333', padding: '10px' }}>
                                <div style={{ borderBottom: '2px solid #333', marginBottom: '10px', paddingBottom: '5px' }}>
                                    <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>LABORATORY QUALITY ANALYSIS REPORT</h4>
                                </div>
                                <div className="receipt-info-grid" style={{ marginBottom: 0 }}>
                                    <div className="receipt-info-col" style={{ borderRight: '1px solid #ccc' }}>
                                        <table className="receipt-info">
                                            <tbody>
                                                <tr>
                                                    <td className="receipt-label" style={{ fontWeight: 'bold' }}>MOISTURE CONTENT</td>
                                                    <td>: {printingBatch.moistureContent}%</td>
                                                </tr>
                                                <tr>
                                                    <td className="receipt-label" style={{ fontWeight: 'bold' }}>SPECIFIC DENSITY</td>
                                                    <td>: {printingBatch.density || '-'} g/L</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="receipt-info-col">
                                        <table className="receipt-info">
                                            <tbody>
                                                <tr>
                                                    <td className="receipt-label" style={{ fontWeight: 'bold' }}>COLOR ANALYSIS (YELLOW)</td>
                                                    <td>: {printingBatch.yellowPercentage || '0'}%</td>
                                                </tr>
                                                <tr>
                                                    <td className="receipt-label" style={{ fontWeight: 'bold' }}>FINAL QUALITY GRADE</td>
                                                    <td>: <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{printingBatch.qualityGrade}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '8pt', color: '#666', fontStyle: 'italic' }}>
                                    * Automated analysis performed by Computer Vision System.
                                </div>
                            </div>
                        </div>

                        {/* Catatan */}
                        {printingBatch.notes && (
                            <div className="receipt-notes">
                                <strong>Catatan:</strong><br />
                                {printingBatch.notes}
                            </div>
                        )}

                        {/* Tanda Tangan */}
                        <div className="receipt-signatures">
                            <div className="signature-box">
                                <p className="sig-role">Diserahkan oleh,</p>
                                <p className="sig-title">Sopir / Pengantar</p>
                                <div className="signature-line"></div>
                                <p className="sig-name">(........................)</p>
                            </div>
                            <div className="signature-box">
                                <p className="sig-role">Diterima oleh,</p>
                                <p className="sig-title">Admin Gudang</p>
                                <div className="signature-line"></div>
                                <p className="sig-name">(........................)</p>
                            </div>
                            <div className="signature-box">
                                <p className="sig-role">Mengetahui,</p>
                                <p className="sig-title">Kepala Pabrik</p>
                                <div className="signature-line"></div>
                                <p className="sig-name">(........................)</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="receipt-footer">
                            <span>Dokumen ini dicetak secara otomatis oleh sistem ERP PMD.</span>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '6pt', opacity: 0.8 }}>v2.23.0</div>
                                <span>Dicetak pada: {new Date().toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RawMaterialReceipt;
