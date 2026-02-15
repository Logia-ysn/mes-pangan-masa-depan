import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { invoiceApi, paymentApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface InvoiceItem {
    id: number;
    id_product_type: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ProductType?: { id: number; code: string; name: string; unit: string };
}

interface Payment {
    id: number;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    User?: { id: number; fullname: string };
}

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'CANCELLED';
    notes?: string;
    created_at: string;
    Customer?: { id: number; name: string; code: string };
    Factory?: { id: number; name: string };
    User?: { id: number; fullname: string };
    InvoiceItem?: InvoiceItem[];
    Payment?: Payment[];
}

const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'badge-info' },
    SENT: { label: 'Terkirim', class: 'badge-warning' },
    PAID: { label: 'Lunas', class: 'badge-success' },
    PARTIAL: { label: 'Sebagian', class: 'badge-warning' },
    CANCELLED: { label: 'Dibatalkan', class: 'badge-error' }
};

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Tunai',
    TRANSFER: 'Transfer',
    CHECK: 'Cek',
    GIRO: 'Giro'
};

const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const formatDate = (d: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const InvoiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const [paymentForm, setPaymentForm] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'TRANSFER',
        reference_number: '',
        notes: ''
    });

    const [editForm, setEditForm] = useState({
        invoice_date: '',
        due_date: '',
        tax: '',
        discount: '',
        notes: '',
        status: ''
    });

    useEffect(() => {
        if (id) fetchInvoice(parseInt(id));
    }, [id]);

    const fetchInvoice = async (invoiceId: number) => {
        try {
            const res = await invoiceApi.getById(invoiceId);
            const data = res.data?.data || res.data;
            setInvoice(data);
        } catch (error) {
            logger.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;
        try {
            await paymentApi.create({
                id_invoice: invoice.id,
                payment_date: paymentForm.payment_date,
                amount: parseFloat(paymentForm.amount),
                payment_method: paymentForm.payment_method,
                reference_number: paymentForm.reference_number || undefined,
                notes: paymentForm.notes || undefined
            });
            setShowPaymentModal(false);
            setPaymentForm({ payment_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'TRANSFER', reference_number: '', notes: '' });
            fetchInvoice(invoice.id);
        } catch (error) {
            logger.error('Error adding payment:', error);
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!invoice) return;
        if (window.confirm('Hapus pembayaran ini?')) {
            try {
                await paymentApi.delete(paymentId);
                fetchInvoice(invoice.id);
            } catch (error) {
                logger.error('Error deleting payment:', error);
            }
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;
        try {
            const payload: Record<string, any> = {};
            if (editForm.invoice_date) payload.invoice_date = editForm.invoice_date;
            if (editForm.due_date) payload.due_date = editForm.due_date;
            if (editForm.tax !== '') payload.tax = parseFloat(editForm.tax);
            if (editForm.discount !== '') payload.discount = parseFloat(editForm.discount);
            if (editForm.notes !== undefined) payload.notes = editForm.notes;
            if (editForm.status) payload.status = editForm.status;

            await invoiceApi.update(invoice.id, payload);
            setShowEditModal(false);
            fetchInvoice(invoice.id);
        } catch (error) {
            logger.error('Error updating invoice:', error);
        }
    };

    const handleDelete = async () => {
        if (!invoice) return;
        if (window.confirm('Hapus invoice ini? Stok akan dikembalikan.')) {
            try {
                await invoiceApi.delete(invoice.id);
                navigate('/sales/invoices');
            } catch (error) {
                logger.error('Error deleting invoice:', error);
            }
        }
    };

    const handlePrintPDF = async () => {
        if (!invoice) return;
        try {
            const res = await invoiceApi.downloadPDF(invoice.id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Create a hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.opacity = '0.01';
            iframe.style.pointerEvents = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                setTimeout(() => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    }
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        window.URL.revokeObjectURL(url);
                    }, 1000);
                }, 200);
            };
        } catch (error) {
            logger.error('Error printing PDF:', error);
        }
    };

    const openEditModal = () => {
        if (!invoice) return;
        setEditForm({
            invoice_date: invoice.invoice_date?.split('T')[0] || '',
            due_date: invoice.due_date?.split('T')[0] || '',
            tax: String(invoice.tax || 0),
            discount: String(invoice.discount || 0),
            notes: invoice.notes || '',
            status: invoice.status
        });
        setShowEditModal(true);
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

    if (!invoice) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">error</span>
                        </div>
                        <h3>Invoice tidak ditemukan</h3>
                        <button className="btn btn-primary" onClick={() => navigate('/sales/invoices')}>Kembali</button>
                    </div>
                </div>
            </>
        );
    }

    const status = statusConfig[invoice.status] || statusConfig.DRAFT;
    const totalPaid = (invoice.Payment || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.total) - totalPaid;

    return (
        <>
            <div className="page-content">
                {/* Back button + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/sales/invoices')}>
                        <span className="material-symbols-outlined icon-sm">arrow_back</span>
                        Kembali
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" onClick={handlePrintPDF}>
                            <span className="material-symbols-outlined icon-sm">picture_as_pdf</span>
                            Cetak PDF
                        </button>
                        <button className="btn btn-secondary" onClick={openEditModal}>
                            <span className="material-symbols-outlined icon-sm">edit</span>
                            Edit
                        </button>
                        <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--error)' }}>
                            <span className="material-symbols-outlined icon-sm">delete</span>
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Invoice Header Card */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <h2 style={{ margin: 0, marginBottom: 8 }}>{invoice.invoice_number}</h2>
                                <span className={`badge ${status.class}`} style={{ fontSize: '0.9rem', padding: '4px 12px' }}>{status.label}</span>
                            </div>
                            <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                <div>Tanggal: {formatDate(invoice.invoice_date)}</div>
                                <div>Jatuh Tempo: {formatDate(invoice.due_date)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
                                <div style={{ fontWeight: 600 }}>{invoice.Customer?.name || '-'}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{invoice.Customer?.code}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Pabrik</div>
                                <div style={{ fontWeight: 600 }}>{invoice.Factory?.name || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Dibuat oleh</div>
                                <div style={{ fontWeight: 600 }}>{invoice.User?.fullname || '-'}</div>
                            </div>
                        </div>

                        {invoice.notes && (
                            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Catatan</div>
                                <div>{invoice.notes}</div>
                            </div>
                        )}
                    </div>
                </div>

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
                                    <th>Qty</th>
                                    <th>Harga Satuan</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.InvoiceItem || []).map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{item.ProductType?.name || '-'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.ProductType?.code}</div>
                                        </td>
                                        <td><span className="font-mono">{Number(item.quantity)}</span> {item.ProductType?.unit || 'kg'}</td>
                                        <td><span className="font-mono">{formatCurrency(item.unit_price)}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="font-mono font-bold">{formatCurrency(item.subtotal)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Pajak</span>
                                <span className="font-mono">+ {formatCurrency(invoice.tax)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Diskon</span>
                                <span className="font-mono">- {formatCurrency(invoice.discount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid var(--border)', fontWeight: 700, fontSize: '1.1rem' }}>
                                <span>Total</span>
                                <span className="font-mono" style={{ color: 'var(--primary)' }}>{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payments Section */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Pembayaran</h3>
                            <p className="card-subtitle">
                                Terbayar: {formatCurrency(totalPaid)} | Sisa: {formatCurrency(remaining > 0 ? remaining : 0)}
                            </p>
                        </div>
                        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Tambah Pembayaran
                            </button>
                        )}
                    </div>

                    {/* Payment Progress Bar */}
                    {Number(invoice.total) > 0 && (
                        <div style={{ padding: '0 24px 16px' }}>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                                <div style={{
                                    background: totalPaid >= Number(invoice.total) ? 'var(--success)' : 'var(--primary)',
                                    height: '100%',
                                    width: `${Math.min(100, (totalPaid / Number(invoice.total)) * 100)}%`,
                                    transition: 'width 0.3s ease',
                                    borderRadius: 8
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                <span>{Math.round((totalPaid / Number(invoice.total)) * 100)}% terbayar</span>
                                <span>{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    )}

                    {(invoice.Payment || []).length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 24px' }}>
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <h3>Belum ada pembayaran</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Jumlah</th>
                                        <th>Metode</th>
                                        <th>No. Referensi</th>
                                        <th>Catatan</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoice.Payment || []).map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{formatDate(payment.payment_date)}</td>
                                            <td><span className="font-mono font-bold">{formatCurrency(payment.amount)}</span></td>
                                            <td>
                                                <span className="badge badge-muted">
                                                    {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                                                </span>
                                            </td>
                                            <td><span className="font-mono" style={{ fontSize: '0.85em' }}>{payment.reference_number || '-'}</span></td>
                                            <td>{payment.notes || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePayment(payment.id)}>
                                                    <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>payments</span>
                                <h3 className="modal-title">Tambah Pembayaran</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddPayment}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Sisa Tagihan</span>
                                        <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(remaining > 0 ? remaining : 0)}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal <span style={{ color: 'var(--error)' }}>*</span></label>
                                        <input type="date" className="form-input" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Jumlah <span style={{ color: 'var(--error)' }}>*</span></label>
                                        <input type="number" className="form-input" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0" min="0" step="0.01" required />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Metode Pembayaran <span style={{ color: 'var(--error)' }}>*</span></label>
                                        <select className="form-input form-select" value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                                            <option value="CASH">Tunai</option>
                                            <option value="TRANSFER">Transfer</option>
                                            <option value="CHECK">Cek</option>
                                            <option value="GIRO">Giro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">No. Referensi</label>
                                        <input type="text" className="form-input" value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} placeholder="No. transfer/cek" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Catatan</label>
                                    <textarea className="form-input" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} placeholder="Catatan pembayaran..." />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    Simpan Pembayaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>edit</span>
                                <h3 className="modal-title">Edit Invoice</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleEdit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal Invoice</label>
                                        <input type="date" className="form-input" value={editForm.invoice_date} onChange={(e) => setEditForm({ ...editForm, invoice_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Jatuh Tempo</label>
                                        <input type="date" className="form-input" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Pajak (Rp)</label>
                                        <input type="number" className="form-input" value={editForm.tax} onChange={(e) => setEditForm({ ...editForm, tax: e.target.value })} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Diskon (Rp)</label>
                                        <input type="number" className="form-input" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} min="0" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-input form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                                        <option value="DRAFT">Draft</option>
                                        <option value="SENT">Terkirim</option>
                                        <option value="CANCELLED">Dibatalkan</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Catatan</label>
                                    <textarea className="form-input" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default InvoiceDetail;
