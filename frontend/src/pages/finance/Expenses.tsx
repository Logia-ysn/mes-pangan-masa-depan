import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import api from '../../services/api';

interface ExpenseRow {
    id: number;
    expense_date: string;
    amount: number;
    description: string;
    receipt_url?: string;
    created_at: string;
    ExpenseCategory?: { id: number; name: string; code: string };
    Factory?: { id: number; name: string };
    User?: { id: number; fullname: string };
}

const Expenses = () => {
    const { showError } = useToast();
    const { selectedFactory } = useFactory();
    const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { limit, offset: page * limit };
            if (selectedFactory) params.id_factory = selectedFactory;

            const res = await api.get('/daily-expenses', { params });
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setExpenses(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setExpenses(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data pengeluaran');
        } finally {
            setLoading(false);
        }
    }, [page, limit, selectedFactory, showError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const totalPages = Math.ceil(total / limit);
    const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return (
        <div className="page-content">
            {/* Summary Cards */}
            <div className="grid grid-3" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL TRANSAKSI</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL PENGELUARAN</div>
                    <div className="text-xl font-bold text-error font-mono">{formatCurrency(totalAmount)}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>RATA-RATA / TRANSAKSI</div>
                    <div className="text-xl font-bold font-mono">{expenses.length ? formatCurrency(totalAmount / expenses.length) : 'Rp 0'}</div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Pengeluaran Harian</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">Tanggal</th>
                                <th className="text-left">Kategori</th>
                                <th className="text-left">Deskripsi</th>
                                <th className="text-right">Jumlah</th>
                                <th className="text-left hide-mobile">Pabrik</th>
                                <th className="text-left hide-mobile">Pencatat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>receipt_long</span>
                                    <div style={{ marginTop: 8 }}>Belum ada data pengeluaran</div>
                                </td></tr>
                            ) : expenses.map(e => (
                                <tr key={e.id}>
                                    <td>{formatDate(e.expense_date)}</td>
                                    <td>
                                        <span className="badge badge-secondary">{e.ExpenseCategory?.name || '-'}</span>
                                    </td>
                                    <td>{e.description}</td>
                                    <td className="text-right font-mono font-bold text-error">{formatCurrency(Number(e.amount))}</td>
                                    <td className="hide-mobile text-secondary">{e.Factory?.name || '-'}</td>
                                    <td className="hide-mobile">{e.User?.fullname || '-'}</td>
                                </tr>
                            ))}
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

export default Expenses;
