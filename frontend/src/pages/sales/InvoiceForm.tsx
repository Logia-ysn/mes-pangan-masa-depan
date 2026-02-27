import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi, customerApi, productTypeApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import { formatCurrency } from '../../utils/formatUtils';

interface Customer {
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

interface InvoiceItemForm {
    id_product_type: number;
    quantity: string;
    unit_price: string;
}

const InvoiceForm = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const {
        selectedFactory,
        factories,
        loading: factoryLoading
    } = useFactory();

    const [formData, setFormData] = useState({
        id_factory: 0,
        id_customer: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        tax: '',
        discount: '',
        notes: ''
    });
    const [items, setItems] = useState<InvoiceItemForm[]>([{ id_product_type: 0, quantity: '', unit_price: '' }]);

    useEffect(() => {
        if (!factoryLoading && selectedFactory) {
            setFormData(prev => ({ ...prev, id_factory: selectedFactory }));
        }
    }, [selectedFactory, factoryLoading]);

    useEffect(() => {
        fetchCustomers();
        fetchProductTypes();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await customerApi.getAll();
            setCustomers(res.data?.data || []);
        } catch (error) {
            logger.error('Error fetching customers:', error);
        }
    };

    const fetchProductTypes = async () => {
        try {
            const res = await productTypeApi.getAll({ category: 'FINISHED_RICE' });
            setProductTypes(res.data?.data || []);
        } catch (error) {
            logger.error('Error fetching product types:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (formData.id_factory === 0) throw new Error('Pilih Pabrik');
            if (formData.id_customer === 0) throw new Error('Pilih Customer');
            if (items.some(i => i.id_product_type === 0)) throw new Error('Pilih Produk untuk semua baris');

            const payload = {
                ...formData,
                tax: parseFloat(formData.tax) || 0,
                discount: parseFloat(formData.discount) || 0,
                items: items.map(i => ({
                    id_product_type: i.id_product_type,
                    quantity: parseFloat(i.quantity) || 0,
                    unit_price: parseFloat(i.unit_price) || 0
                }))
            };
            await invoiceApi.create(payload);
            showSuccess('Berhasil', 'Invoice berhasil dibuat');
            navigate('/sales/invoices');
        } catch (error: any) {
            logger.error('Error creating invoice:', error);
            showError('Gagal', error.message || 'Gagal membuat invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const addItemRow = () => {
        setItems([...items, { id_product_type: 0, quantity: '', unit_price: '' }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof InvoiceItemForm, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const calcSubtotal = () => items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
    const calcTotal = () => calcSubtotal() + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0);

    return (
        <div className="page-content">
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0 }}>New Sales Invoice</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Create a new billing statement for your customer</p>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/sales/invoices')}>
                    Kembali
                </button>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
                {/* Section 1: Info */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>1</div>
                        <h3 style={{ margin: 0 }}>Informasi Invoice</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">Pabrik <span style={{ color: 'var(--error)' }}>*</span></label>
                            <select className="form-input form-select" value={formData.id_factory} onChange={(e) => setFormData({ ...formData, id_factory: parseInt(e.target.value) })} required>
                                <option value={0}>Pilih Pabrik</option>
                                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Customer <span style={{ color: 'var(--error)' }}>*</span></label>
                            <select className="form-input form-select" value={formData.id_customer} onChange={(e) => setFormData({ ...formData, id_customer: parseInt(e.target.value) })} required>
                                <option value={0}>Pilih Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Tanggal Invoice <span style={{ color: 'var(--error)' }}>*</span></label>
                            <input type="date" className="form-input" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tanggal Jatuh Tempo <span style={{ color: 'var(--error)' }}>*</span></label>
                            <input type="date" className="form-input" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label className="form-label">Catatan</label>
                        <textarea className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Catatan tambahan untuk invoice ini..." />
                    </div>
                </div>

                {/* Section 2: Items */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>2</div>
                        <h3 style={{ margin: 0 }}>Item Produk</h3>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th>Kuantitas</th>
                                    <th>Harga Satuan</th>
                                    <th>Subtotal</th>
                                    <th style={{ width: 50 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <select className="form-input form-select" value={item.id_product_type} onChange={(e) => updateItem(idx, 'id_product_type', parseInt(e.target.value))} style={{ minWidth: 200 }}>
                                                <option value={0}>Pilih Produk</option>
                                                {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} placeholder="0" min="0" step="0.01" />
                                        </td>
                                        <td>
                                            <input type="number" className="form-input" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} placeholder="0" min="0" />
                                        </td>
                                        <td>
                                            <span className="font-mono" style={{ fontWeight: 600 }}>{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}</span>
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItemRow(idx)} disabled={items.length <= 1}>
                                                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ marginTop: 12 }} onClick={addItemRow}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Tambah Baris
                    </button>
                </div>

                {/* Section 3: Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 40 }}>
                    <div>{/* Empty left space */}</div>
                    <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(calcSubtotal())}</span>
                            </div>
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Pajak (Rp)</label>
                                <input type="number" className="form-input" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} placeholder="0" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 12 }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Diskon (Rp)</label>
                                <input type="number" className="form-input" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} placeholder="0" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-color)', paddingTop: 16, fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
                            <span>Total</span>
                            <span>{formatCurrency(calcTotal())}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/sales/invoices')}>Batal</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                        {submitting ? 'Menyimpan...' : 'Simpan Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
