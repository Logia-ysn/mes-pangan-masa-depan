import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface PaymentRow {
    id: number;
    id_invoice: number;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    created_at: string;
    User?: { id: number; fullname: string };
    Invoice?: {
        id: number;
        invoice_number: string;
        total: number;
        Customer?: { name: string };
    };
}

const methodLabel: Record<string, { label: string; color: string }> = {
    CASH: { label: 'Cash', color: '#16a34a' },
    BANK_TRANSFER: { label: 'Transfer', color: '#2563eb' },
    GIRO: { label: 'Giro', color: '#7c3aed' },
    CHECK: { label: 'Cek', color: '#ea580c' },
};

const Payments = () => {
    const { showError } = useToast();
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);
    const [filterMethod, setFilterMethod] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { limit, offset: page * limit };
            if (filterMethod) params.payment_method = filterMethod;

            const res = await paymentApi.getAll(params);
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setPayments(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setPayments(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data pembayaran');
        } finally {
            setLoading(false);
        }
    }, [page, limit, filterMethod, showError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const totalPages = Math.ceil(total / limit);
    const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

    return (
        <div className="page-content">
            {/* Summary Cards */}
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL TRANSAKSI</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL DITERIMA</div>
                    <div className="text-xl font-bold text-success font-mono">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>CASH</div>
                    <div className="text-xl font-bold font-mono" style={{ color: '#16a34a' }}>
                        {payments.filter(p => p.payment_method === 'CASH').length}
                    </div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TRANSFER</div>
                    <div className="text-xl font-bold font-mono" style={{ color: '#2563eb' }}>
                        {payments.filter(p => p.payment_method === 'BANK_TRANSFER').length}
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="text-secondary text-sm">Filter Metode:</span>
                    <select className="form-input" value={filterMethod} onChange={e => { setFilterMethod(e.target.value); setPage(0); }} style={{ minWidth: 160 }}>
                        <option value="">Semua Metode</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Transfer Bank</option>
                        <option value="GIRO">Giro</option>
                        <option value="CHECK">Cek</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Riwayat Pembayaran Masuk</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">Tanggal</th>
                                <th className="text-left">No. Invoice</th>
                                <th className="text-left">Customer</th>
                                <th className="text-right">Jumlah</th>
                                <th className="text-center">Metode</th>
                                <th className="text-left hide-mobile">Referensi</th>
                                <th className="text-left hide-mobile">Kasir</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>payments</span>
                                    <div style={{ marginTop: 8 }}>Belum ada data pembayaran</div>
                                </td></tr>
                            ) : payments.map(p => {
                                const ml = methodLabel[p.payment_method] || { label: p.payment_method, color: '#6b7280' };
                                return (
                                    <tr key={p.id}>
                                        <td>{formatDate(p.payment_date)}</td>
                                        <td className="font-mono">{p.Invoice?.invoice_number || `INV-${p.id_invoice}`}</td>
                                        <td>{p.Invoice?.Customer?.name || '-'}</td>
                                        <td className="text-right font-mono font-bold" style={{ color: '#16a34a' }}>{formatCurrency(Number(p.amount))}</td>
                                        <td className="text-center">
                                            <span className="badge" style={{ background: `${ml.color}18`, color: ml.color, border: `1px solid ${ml.color}40` }}>
                                                {ml.label}
                                            </span>
                                        </td>
                                        <td className="hide-mobile font-mono text-secondary">{p.reference_number || '-'}</td>
                                        <td className="hide-mobile">{p.User?.fullname || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
                        <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                            <span className="material-symbols-outlined icon-sm">chevron_left</span>
                        </button>
                        <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{page + 1} dari {totalPages}</span>
                        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                            <span className="material-symbols-outlined icon-sm">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;
