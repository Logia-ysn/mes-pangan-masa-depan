import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deliveryOrderApi, invoiceApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';

interface InvoiceItem {
    id: number;
    id_product_type: number;
    quantity: number;
    ProductType: {
        name: string;
        unit: string;
        code: string;
    };
}

interface Invoice {
    id: number;
    invoice_number: string;
    id_customer: number;
    Customer?: { id: number; name: string; code: string };
    InvoiceItem: InvoiceItem[];
}

const DeliveryOrderForm = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        do_number: `DO-${Date.now().toString().slice(-6)}`,
        delivery_date: new Date().toISOString().split('T')[0],
        driver_name: '',
        vehicle_number: '',
        notes: ''
    });

    const [items, setItems] = useState<Record<number, number>>({});

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice(parseInt(invoiceId));
        }
    }, [invoiceId]);

    const fetchInvoice = async (id: number) => {
        try {
            setLoading(true);
            const response = await invoiceApi.getById(id);
            const data = response.data?.data || response.data;
            setInvoice(data);

            if (data?.InvoiceItem) {
                const initialItems: Record<number, number> = {};
                data.InvoiceItem.forEach((item: InvoiceItem) => {
                    initialItems[item.id] = parseFloat(item.quantity.toString());
                });
                setItems(initialItems);
            }
        } catch (error) {
            logger.error('Error fetching invoice:', error);
            showError('Error', 'Gagal memuat data Invoice');
            navigate('/sales/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (itemId: number, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => ({
            ...prev,
            [itemId]: numValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        try {
            setSubmitting(true);
            const payload = {
                id_invoice: invoice.id,
                do_number: formData.do_number,
                delivery_date: formData.delivery_date,
                driver_name: formData.driver_name || undefined,
                vehicle_number: formData.vehicle_number || undefined,
                notes: formData.notes || undefined,
                items: Object.keys(items).map(itemId => ({
                    id_invoice_item: parseInt(itemId),
                    quantity_delivered: items[parseInt(itemId)]
                })).filter(i => i.quantity_delivered > 0)
            };

            if (payload.items.length === 0) {
                showError('Peringatan', 'Minimal satu item harus dikirim');
                setSubmitting(false);
                return;
            }

            await deliveryOrderApi.create(payload);
            showSuccess('Berhasil', 'Surat Jalan berhasil dibuat');
            navigate('/sales/delivery-orders');
        } catch (error: any) {
            logger.error('Error creating delivery order:', error);
            showError('Gagal', error.response?.data?.message || 'Gagal membuat Surat Jalan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="animate-spin material-symbols-outlined icon-lg" style={{ color: 'var(--primary)' }}>refresh</div>
            </div>
        );
    }

    if (!invoice) return null;

    return (
        <div className="page-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Kembali
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Buat Surat Jalan (DO)</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="material-symbols-outlined icon-lg" style={{ color: 'var(--primary)' }}>local_shipping</span>
                            <div>
                                <h3 className="card-title">Referensi: {invoice.invoice_number}</h3>
                                <p className="card-subtitle">Pelanggan: {invoice.Customer?.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                            <div className="form-group">
                                <label className="form-label">No. Surat Jalan <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input type="text" className="form-input" value={formData.do_number} onChange={e => setFormData({ ...formData, do_number: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tanggal Pengiriman <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input type="date" className="form-input" value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Supir / Pengirim</label>
                                <input type="text" className="form-input" value={formData.driver_name} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} placeholder="Nama Supir" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">No. Kendaraan</label>
                                <input type="text" className="form-input" value={formData.vehicle_number} onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })} placeholder="Plat Nomor" />
                            </div>
                        </div>

                        <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Item Pengiriman</h4>
                        <div className="table-container" style={{ marginBottom: 24 }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Kode</th>
                                        <th style={{ textAlign: 'right' }}>Total Order</th>
                                        <th style={{ width: 150 }}>Dikirim Sekarang</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.InvoiceItem.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.ProductType?.name}</td>
                                            <td><span className="badge badge-secondary">{item.ProductType?.code}</span></td>
                                            <td style={{ textAlign: 'right' }}>{parseFloat(item.quantity.toString())} {item.ProductType?.unit}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={items[item.id] !== undefined ? items[item.id] : ''}
                                                        onChange={(e) => handleItemChange(item.id, e.target.value)}
                                                        max={parseFloat(item.quantity.toString())}
                                                        min={0}
                                                        step="0.01"
                                                    />
                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.ProductType?.unit}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Catatan</label>
                            <textarea className="form-input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Catatan tambahan (opsional)..." />
                        </div>
                    </div>

                    <div className="card-footer" style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? (
                                <span className="material-symbols-outlined icon-sm animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined icon-sm">save</span>
                            )}
                            Simpan Surat Jalan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryOrderForm;
