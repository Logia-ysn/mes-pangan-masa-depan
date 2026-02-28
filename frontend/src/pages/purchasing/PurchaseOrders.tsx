import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderApi, supplierApi, productTypeApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface PurchaseOrder {
    id: number;
    po_number: string;
    order_date: string;
    expected_date: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED';
    notes?: string;
    id_factory: number;
    id_supplier: number | null;
    Supplier?: { id: number; name: string; code: string };
    Factory?: { id: number; name: string };
}

interface Supplier {
    id: number;
    code: string;
    name: string;
}



interface ProductType {
    id: number;
    code: string;
    name: string;
    unit: string;
}

interface POItemForm {
    id_product_type: number;
    quantity: string;
    unit_price: string;
}

const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'badge-info' },
    APPROVED: { label: 'Disetujui', class: 'badge-primary' },
    SENT: { label: 'Terkirim', class: 'badge-warning' },
    PARTIAL_RECEIVED: { label: 'Diterima Sebagian', class: 'badge-warning' },
    RECEIVED: { label: 'Diterima', class: 'badge-success' },
    CANCELLED: { label: 'Dibatalkan', class: 'badge-error' }
};

const PurchaseOrders = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

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

    const [formData, setFormData] = useState({
        id_factory: 0,
        id_supplier: 0,
        order_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        tax: '',
        discount: '',
        notes: ''
    });
    const [items, setItems] = useState<POItemForm[]>([{ id_product_type: 0, quantity: '', unit_price: '' }]);

    useEffect(() => {
        if (!factoryLoading) {
            fetchPurchaseOrders();
        }
    }, [selectedFactory, page, factoryLoading]);

    useEffect(() => {
        fetchSuppliers();
        fetchProductTypes();
    }, []);

    const fetchPurchaseOrders = async () => {
        try {
            setLoading(true);
            const response = await purchaseOrderApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined
            });
            const data = response.data?.data || response.data || [];
            const total = response.data?.total || data.length;

            setPurchaseOrders(Array.isArray(data) ? data : []);
            setTotalItems(total);
        } catch (error) {
            logger.error('Error fetching purchase orders:', error);
            showError('Error', 'Gagal memuat data purchase order');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierApi.getAll({ limit: 500 });
            const data = response.data?.data || response.data || [];
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching suppliers:', error);
        }
    };

    const fetchProductTypes = async () => {
        try {
            const response = await productTypeApi.getAll();
            const data = response.data?.data || response.data || [];
            setProductTypes(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching product types:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                id_factory: formData.id_factory,
                id_supplier: formData.id_supplier > 0 ? formData.id_supplier : null,
                order_date: formData.order_date,
                expected_date: formData.expected_date,
                tax: formData.tax ? parseFloat(formData.tax) : 0,
                discount: formData.discount ? parseFloat(formData.discount) : 0,
                notes: formData.notes || undefined,
                items: items.filter(i => i.id_product_type > 0).map(i => ({
                    id_product_type: i.id_product_type,
                    quantity: parseFloat(i.quantity) || 0,
                    unit_price: parseFloat(i.unit_price) || 0
                }))
            };
            await purchaseOrderApi.create(payload);
            showSuccess('Berhasil', 'Purchase Order berhasil dibuat');
            fetchPurchaseOrders();
            closeModal();
        } catch (error) {
            logger.error('Error creating purchase order:', error);
            showError('Gagal', 'Gagal membuat purchase order');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus Purchase Order ini?')) {
            try {
                await purchaseOrderApi.delete(id);
                showSuccess('Berhasil', 'Purchase Order berhasil dihapus');
                fetchPurchaseOrders();
            } catch (error) {
                logger.error('Error deleting purchase order:', error);
                showError('Gagal', 'Gagal menghapus purchase order');
            }
        }
    };

    const openModal = () => {
        setFormData({
            id_factory: selectedFactory || (factories.length > 0 ? factories[0].id : 0),
            id_supplier: 0,
            order_date: new Date().toISOString().split('T')[0],
            expected_date: '',
            tax: '',
            discount: '',
            notes: ''
        });
        setItems([{ id_product_type: 0, quantity: '', unit_price: '' }]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const addItemRow = () => {
        setItems([...items, { id_product_type: 0, quantity: '', unit_price: '' }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof POItemForm, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const calcSubtotal = () => items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
    const calcTotal = () => calcSubtotal() + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0);

    // Stats
    const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + Number(po.total), 0);
    const pendingReceiptCount = purchaseOrders.filter(po => ['APPROVED', 'SENT', 'PARTIAL_RECEIVED'].includes(po.status)).length;
    const completedCount = purchaseOrders.filter(po => po.status === 'RECEIVED').length;

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

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Amount (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">payments</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalPOAmount)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Menunggu Penerimaan</span>
                        <span className="material-symbols-outlined stat-card-icon">pending</span>
                    </div>
                    <div className="stat-card-value">{pendingReceiptCount}</div>
                    <span className="badge badge-warning">Proses</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Selesai</span>
                        <span className="material-symbols-outlined stat-card-icon">check_circle</span>
                    </div>
                    <div className="stat-card-value">{completedCount}</div>
                    <span className="badge badge-success">Diterima</span>
                </div>
            </div>

            {/* PO List */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Daftar Purchase Order</h3>
                        <p className="card-subtitle">Kelola pembelian bahan baku</p>
                    </div>
                    <button className="btn btn-primary" onClick={openModal}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Buat PO
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                ) : purchaseOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </div>
                        <h3>Belum ada Purchase Order</h3>
                        <p>Klik tombol "Buat PO" untuk membuat purchase order baru</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>No. PO</th>
                                        <th className="hide-mobile">Tanggal</th>
                                        <th>Supplier</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseOrders.map((po) => {
                                        const status = statusConfig[po.status] || statusConfig.DRAFT;
                                        return (
                                            <tr key={po.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/purchasing/purchase-orders/${po.id}`)}>
                                                <td>
                                                    <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                        {po.po_number}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile">{formatDate(po.order_date)}</td>
                                                <td>{po.Supplier?.name || 'General (Umum)'}</td>
                                                <td>
                                                    <span className="font-mono">{formatCurrency(po.total)}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/purchasing/purchase-orders/${po.id}`); }}>
                                                            <span className="material-symbols-outlined icon-sm">visibility</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(po.id); }}>
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

            {/* Create PO Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
                            <div className="modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                                        shopping_cart
                                    </span>
                                    <h3 className="modal-title">Buat Purchase Order Baru</h3>
                                </div>
                                <button className="modal-close" onClick={closeModal}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    {/* Section 1: Info */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>1</span>
                                            <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', fontSize: 12 }}>INFORMASI PO</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div className="form-group">
                                                <label className="form-label">Pabrik <span style={{ color: 'var(--error)' }}>*</span></label>
                                                <select className="form-input form-select" value={formData.id_factory} onChange={(e) => setFormData({ ...formData, id_factory: parseInt(e.target.value) })} required>
                                                    <option value={0}>Pilih Pabrik</option>
                                                    {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Supplier</label>
                                                <select className="form-input form-select" value={formData.id_supplier} onChange={(e) => setFormData({ ...formData, id_supplier: parseInt(e.target.value) })}>
                                                    <option value={0}>General (Umum)</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div className="form-group">
                                                <label className="form-label">Tanggal Order <span style={{ color: 'var(--error)' }}>*</span></label>
                                                <input type="date" className="form-input" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Tanggal Diharapkan <span style={{ color: 'var(--error)' }}>*</span></label>
                                                <input type="date" className="form-input" value={formData.expected_date} onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })} required />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Catatan</label>
                                            <textarea className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Catatan tambahan..." />
                                        </div>
                                    </div>

                                    {/* Section 2: Items */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>2</span>
                                            <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', fontSize: 12 }}>ITEM PRODUK</span>
                                        </div>

                                        <div className="table-container" style={{ marginBottom: 12 }}>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Produk</th>
                                                        <th>Qty</th>
                                                        <th>Harga Satuan</th>
                                                        <th>Subtotal</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <select className="form-input form-select" value={item.id_product_type} onChange={(e) => updateItem(idx, 'id_product_type', parseInt(e.target.value))} style={{ minWidth: 160 }}>
                                                                    <option value={0}>Pilih Produk</option>
                                                                    {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>)}
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <input type="number" className="form-input" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder="0" min="0" step="0.01" style={{ width: 100 }} />
                                                            </td>
                                                            <td>
                                                                <input type="number" className="form-input" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} placeholder="0" min="0" style={{ width: 140 }} />
                                                            </td>
                                                            <td>
                                                                <span className="font-mono">{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}</span>
                                                            </td>
                                                            <td>
                                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItemRow(idx)} disabled={items.length <= 1}>
                                                                    <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>close</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
                                            <span className="material-symbols-outlined icon-sm">add</span>
                                            Tambah Item
                                        </button>
                                    </div>

                                    {/* Section 3: Summary */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>3</span>
                                            <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', fontSize: 12 }}>RINGKASAN</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div className="form-group">
                                                <label className="form-label">Pajak (Rp)</label>
                                                <input type="number" className="form-input" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} placeholder="0" min="0" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Diskon (Rp)</label>
                                                <input type="number" className="form-input" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} placeholder="0" min="0" />
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, marginTop: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                                <span className="font-mono">{formatCurrency(calcSubtotal())}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Pajak</span>
                                                <span className="font-mono">+ {formatCurrency(parseFloat(formData.tax) || 0)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Diskon</span>
                                                <span className="font-mono">- {formatCurrency(parseFloat(formData.discount) || 0)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: '1.1rem' }}>
                                                <span>Total</span>
                                                <span className="font-mono" style={{ color: 'var(--primary)' }}>{formatCurrency(calcTotal())}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                                    <button type="submit" className="btn btn-primary">
                                        <span className="material-symbols-outlined icon-sm">save</span>
                                        Buat Purchase Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PurchaseOrders;
