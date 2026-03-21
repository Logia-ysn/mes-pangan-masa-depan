import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { purchaseOrderApi, goodsReceiptApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface POItem {
    id: number;
    id_product_type: number;
    quantity: number;
    received_quantity: number;
    unit_price: number;
    subtotal: number;
    ProductType?: { id: number; code: string; name: string; unit: string };
}

interface GoodsReceiptItem {
    id: number;
    id_purchase_order_item: number;
    quantity_received: number;
    PurchaseOrderItem?: { ProductType?: { id: number; code: string; name: string } };
}

interface GoodsReceipt {
    id: number;
    receipt_number: string;
    receipt_date: string;
    notes?: string;
    User?: { id: number; fullname: string };
    GoodsReceiptItem?: GoodsReceiptItem[];
}

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
    id_variety?: number | null;
    valid_until?: string | null;
    pricing_type?: 'STANDARD' | 'PLAFON';
    pricing_data?: any;
    created_at: string;
    Supplier?: { id: number; name: string; code: string; phone?: string };
    Factory?: { id: number; name: string };
    User?: { id: number; fullname: string };
    Variety?: { id: number; name: string; code: string };
    PurchaseOrderItem?: POItem[];
    GoodsReceipt?: GoodsReceipt[];
}

const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'badge-info' },
    APPROVED: { label: 'Disetujui', class: 'badge-primary' },
    SENT: { label: 'Terkirim', class: 'badge-warning' },
    PARTIAL_RECEIVED: { label: 'Diterima Sebagian', class: 'badge-warning' },
    RECEIVED: { label: 'Diterima', class: 'badge-success' },
    CANCELLED: { label: 'Dibatalkan', class: 'badge-error' }
};

const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const PurchaseOrderDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [po, setPO] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [showReceiveModal, setShowReceiveModal] = useState(false);

    const [receiveForm, setReceiveForm] = useState<{
        receipt_date: string;
        notes: string;
        items: { id_purchase_order_item: number; quantity: string }[];
    }>({
        receipt_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
    });

    useEffect(() => {
        if (id) fetchPO(parseInt(id));
    }, [id]);

    const fetchPO = async (poId: number) => {
        try {
            const res = await purchaseOrderApi.getById(poId);
            const data = res.data?.data || res.data;
            setPO(data);
        } catch (error) {
            logger.error('Error fetching purchase order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!po) return;
        if (window.confirm('Setujui Purchase Order ini?')) {
            try {
                await purchaseOrderApi.approve(po.id);
                fetchPO(po.id);
            } catch (error) {
                logger.error('Error approving PO:', error);
            }
        }
    };

    const handleCancel = async () => {
        if (!po) return;
        if (window.confirm('Batalkan Purchase Order ini?')) {
            try {
                await purchaseOrderApi.cancel(po.id);
                fetchPO(po.id);
            } catch (error) {
                logger.error('Error cancelling PO:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (!po) return;
        if (window.confirm('Hapus Purchase Order ini?')) {
            try {
                await purchaseOrderApi.delete(po.id);
                navigate('/receiving/purchase-orders');
            } catch (error) {
                logger.error('Error deleting PO:', error);
            }
        }
    };

    const handleDeleteReceipt = async (receiptId: number) => {
        if (!po) return;
        if (window.confirm('Hapus penerimaan barang ini?')) {
            try {
                await goodsReceiptApi.delete(receiptId);
                fetchPO(po.id);
            } catch (error) {
                logger.error('Error deleting goods receipt:', error);
            }
        }
    };

    const openReceiveModal = () => {
        if (!po) return;
        const pendingItems = (po.PurchaseOrderItem || []).filter(item => {
            const remaining = Number(item.quantity) - Number(item.received_quantity || 0);
            return remaining > 0;
        });
        setReceiveForm({
            receipt_date: new Date().toISOString().split('T')[0],
            notes: '',
            items: pendingItems.map(item => ({
                id_purchase_order_item: item.id,
                quantity: ''
            }))
        });
        setShowReceiveModal(true);
    };

    const handleReceiveGoods = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!po) return;
        try {
            const payload = {
                id_purchase_order: po.id,
                receipt_date: receiveForm.receipt_date,
                notes: receiveForm.notes || undefined,
                items: receiveForm.items
                    .filter(i => parseFloat(i.quantity) > 0)
                    .map(i => ({
                        id_purchase_order_item: i.id_purchase_order_item,
                        quantity: parseFloat(i.quantity)
                    }))
            };
            await goodsReceiptApi.create(payload);
            setShowReceiveModal(false);
            fetchPO(po.id);
        } catch (error) {
            logger.error('Error creating goods receipt:', error);
        }
    };

    const updateReceiveItem = (index: number, value: string) => {
        const updated = [...receiveForm.items];
        updated[index] = { ...updated[index], quantity: value };
        setReceiveForm({ ...receiveForm, items: updated });
    };

    if (loading) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                </div>
            </>
        );
    }

    if (!po) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">error</span>
                        </div>
                        <h3>Purchase Order tidak ditemukan</h3>
                        <button className="btn btn-primary" onClick={() => navigate('/receiving/purchase-orders')}>Kembali</button>
                    </div>
                </div>
            </>
        );
    }

    const status = statusConfig[po.status] || statusConfig.DRAFT;
    const poItems = po.PurchaseOrderItem || [];
    const receipts = po.GoodsReceipt || [];

    // Get pending items for the receive modal
    const pendingItems = poItems.filter(item => {
        const remaining = Number(item.quantity) - Number(item.received_quantity || 0);
        return remaining > 0;
    });

    return (
        <>
            <div className="page-content">
                {/* Back button + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/receiving/purchase-orders')}>
                        <span className="material-symbols-outlined icon-sm">arrow_back</span>
                        Kembali
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" onClick={() => window.open(`/print/purchase-orders/${po.id}`, '_blank')}>
                            <span className="material-symbols-outlined icon-sm">print</span>
                            Cetak PO
                        </button>
                        {po.status === 'DRAFT' && (
                            <button className="btn btn-primary" onClick={handleApprove}>
                                <span className="material-symbols-outlined icon-sm">check_circle</span>
                                Setujui
                            </button>
                        )}
                        {['APPROVED', 'SENT', 'PARTIAL_RECEIVED'].includes(po.status) && (
                            <button className="btn btn-primary" onClick={openReceiveModal}>
                                <span className="material-symbols-outlined icon-sm">inventory</span>
                                Terima Barang
                            </button>
                        )}
                        {!['CANCELLED', 'RECEIVED'].includes(po.status) && (
                            <button className="btn btn-secondary" onClick={handleCancel} style={{ color: 'var(--error)' }}>
                                <span className="material-symbols-outlined icon-sm">cancel</span>
                                Batalkan
                            </button>
                        )}
                        {['DRAFT', 'CANCELLED'].includes(po.status) && (
                            <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--error)' }}>
                                <span className="material-symbols-outlined icon-sm">delete</span>
                                Hapus
                            </button>
                        )}
                    </div>
                </div>

                {/* PO Header Card */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: 8 }}>{po.po_number}</h2>
                                <span className={`badge ${status.class}`} style={{ fontSize: '0.9rem', padding: '4px 12px' }}>{status.label}</span>
                            </div>
                            <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                <div>Tanggal Order: {formatDate(po.order_date)}</div>
                                <div>Tanggal Diharapkan: {formatDate(po.expected_date)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Supplier</div>
                                <div style={{ fontWeight: 600 }}>{po.Supplier?.name || 'General (Umum)'}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{po.Supplier?.code}</div>
                                {po.Supplier?.phone && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{po.Supplier.phone}</div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Pabrik</div>
                                <div style={{ fontWeight: 600 }}>{po.Factory?.name || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Dibuat oleh</div>
                                <div style={{ fontWeight: 600 }}>{po.User?.fullname || '-'}</div>
                            </div>
                        </div>

                        {po.notes && (
                            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Catatan</div>
                                <div>{po.notes}</div>
                            </div>
                        )}
                    </div>
                </div>
                
                {po.pricing_type === 'PLAFON' && po.pricing_data?.grid && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 className="card-title">Plafon Harga Beli</h3>
                                <p className="card-subtitle">Jenis Gabah: <span className="font-bold text-primary">{po.Variety?.name}</span></p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Berlaku Sampai</div>
                                <div style={{ fontWeight: 600 }}>{formatDate(po.valid_until || po.order_date)}</div>
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>% KA</th>
                                        <th style={{ textAlign: 'right' }}>KW 1</th>
                                        <th style={{ textAlign: 'right' }}>KW 2</th>
                                        <th style={{ textAlign: 'right' }}>KW 3</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.pricing_data.grid.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.moisture}%</td>
                                            <td style={{ textAlign: 'right' }} className="font-mono">{formatCurrency(row.kw1)}</td>
                                            <td style={{ textAlign: 'right' }} className="font-mono">{formatCurrency(row.kw2)}</td>
                                            <td style={{ textAlign: 'right' }} className="font-mono">{formatCurrency(row.kw3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Items Table */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <h3 className="card-title">Item Produk</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Produk</th>
                                    <th>Qty Dipesan</th>
                                    <th>Qty Diterima</th>
                                    <th>Sisa</th>
                                    <th>Harga Satuan</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poItems.map((item, idx) => {
                                    const ordered = Number(item.quantity);
                                    const received = Number(item.received_quantity || 0);
                                    const remaining = ordered - received;
                                    const progressPct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                                    return (
                                        <tr key={item.id}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{item.ProductType?.name || '-'}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.ProductType?.code}</div>
                                            </td>
                                            <td><span className="font-mono">{ordered}</span> {item.ProductType?.unit || 'kg'}</td>
                                            <td>
                                                <span className="font-mono">{received}</span> {item.ProductType?.unit || 'kg'}
                                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 4, marginTop: 4, overflow: 'hidden', maxWidth: 80 }}>
                                                    <div style={{
                                                        background: progressPct >= 100 ? 'var(--success)' : 'var(--primary)',
                                                        height: '100%',
                                                        width: `${Math.min(100, progressPct)}%`,
                                                        borderRadius: 4
                                                    }} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-mono" style={{ color: remaining > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                                    {remaining}
                                                </span> {item.ProductType?.unit || 'kg'}
                                            </td>
                                            <td><span className="font-mono">{formatCurrency(item.unit_price)}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="font-mono font-bold">{formatCurrency(item.subtotal)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                <span className="font-mono">{formatCurrency(po.subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Pajak</span>
                                <span className="font-mono">+ {formatCurrency(po.tax)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Diskon</span>
                                <span className="font-mono">- {formatCurrency(po.discount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: '1.1rem' }}>
                                <span>Total</span>
                                <span className="font-mono" style={{ color: 'var(--primary)' }}>{formatCurrency(po.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Goods Receipts Section */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Penerimaan Barang</h3>
                            <p className="card-subtitle">
                                {receipts.length} penerimaan tercatat
                            </p>
                        </div>
                        {['APPROVED', 'SENT', 'PARTIAL_RECEIVED'].includes(po.status) && pendingItems.length > 0 && (
                            <button className="btn btn-primary" onClick={openReceiveModal}>
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Terima Barang
                            </button>
                        )}
                    </div>

                    {receipts.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 24px' }}>
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <h3>Belum ada penerimaan barang</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>No. Receipt</th>
                                        <th>Dibuat oleh</th>
                                        <th>Items</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipts.map((receipt) => {
                                        const receiptItems = receipt.GoodsReceiptItem || [];
                                        const itemSummary = receiptItems.map(ri =>
                                            `${ri.PurchaseOrderItem?.ProductType?.name || 'Item'}: ${ri.quantity_received}`
                                        ).join(', ');
                                        return (
                                            <tr key={receipt.id}>
                                                <td>{formatDate(receipt.receipt_date)}</td>
                                                <td>
                                                    <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                        {receipt.receipt_number}
                                                    </span>
                                                </td>
                                                <td>{receipt.User?.fullname || '-'}</td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {itemSummary || '-'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteReceipt(receipt.id)}>
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                    </button>
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

            {/* Receive Goods Modal */}
            {showReceiveModal && (
                <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>inventory</span>
                                <h3 className="modal-title">Terima Barang</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowReceiveModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleReceiveGoods}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group">
                                    <label className="form-label">Tanggal Penerimaan <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <input type="date" className="form-input" value={receiveForm.receipt_date} onChange={(e) => setReceiveForm({ ...receiveForm, receipt_date: e.target.value })} required />
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Item yang akan diterima:</div>
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Produk</th>
                                                    <th>Dipesan</th>
                                                    <th>Diterima</th>
                                                    <th>Sisa</th>
                                                    <th>Qty Terima</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingItems.map((item, idx) => {
                                                    const ordered = Number(item.quantity);
                                                    const received = Number(item.received_quantity || 0);
                                                    const remaining = ordered - received;
                                                    return (
                                                        <tr key={item.id}>
                                                            <td>
                                                                <div style={{ fontWeight: 500 }}>{item.ProductType?.name || '-'}</div>
                                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.ProductType?.code}</div>
                                                            </td>
                                                            <td><span className="font-mono">{ordered}</span></td>
                                                            <td><span className="font-mono">{received}</span></td>
                                                            <td><span className="font-mono" style={{ color: 'var(--warning)' }}>{remaining}</span></td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-input"
                                                                    value={receiveForm.items[idx]?.quantity || ''}
                                                                    onChange={(e) => updateReceiveItem(idx, e.target.value)}
                                                                    placeholder="0"
                                                                    min="0"
                                                                    max={remaining}
                                                                    step="0.01"
                                                                    style={{ width: 100 }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Catatan</label>
                                    <textarea className="form-input" value={receiveForm.notes} onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })} rows={2} placeholder="Catatan penerimaan barang..." />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowReceiveModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    Simpan Penerimaan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default PurchaseOrderDetail;
