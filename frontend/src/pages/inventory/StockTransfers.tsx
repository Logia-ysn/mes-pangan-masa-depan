import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface TransferRow {
    id: number;
    movement_date: string;
    quantity: number;
    movement_type: string;
    reference_number?: string;
    notes?: string;
    created_at: string;
    Stock?: { id: number; ProductType?: { name: string }; RiceLevel?: { name: string } };
    User?: { id: number; fullname: string };
    FromFactory?: { id: number; name: string };
    ToFactory?: { id: number; name: string };
}

const StockTransfers = () => {
    const { showError } = useToast();
    const [transfers, setTransfers] = useState<TransferRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/stock-movements', {
                params: { limit, offset: page * limit, movement_type: 'TRANSFER' }
            });
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setTransfers(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setTransfers(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data transfer stok');
        } finally {
            setLoading(false);
        }
    }, [page, limit, showError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    const totalPages = Math.ceil(total / limit);
    const totalQty = transfers.reduce((s, t) => s + Number(t.quantity), 0);

    return (
        <div className="page-content">
            {/* Summary */}
            <div className="grid grid-3" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL TRANSFER</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL QUANTITY</div>
                    <div className="text-xl font-bold font-mono text-primary">{formatNumber(totalQty)} kg</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>HALAMAN</div>
                    <div className="text-2xl font-bold">{page + 1} / {totalPages || 1}</div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Riwayat Transfer Stok</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">Tanggal</th>
                                <th className="text-left">Produk</th>
                                <th className="text-left">Dari</th>
                                <th className="text-left">Ke</th>
                                <th className="text-right">Qty</th>
                                <th className="text-left hide-mobile">Referensi</th>
                                <th className="text-left hide-mobile">Oleh</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : transfers.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>swap_horiz</span>
                                    <div style={{ marginTop: 8 }}>Belum ada riwayat transfer stok</div>
                                </td></tr>
                            ) : transfers.map(t => (
                                <tr key={t.id}>
                                    <td>{formatDate(t.movement_date)}</td>
                                    <td className="font-medium">
                                        {t.Stock?.ProductType?.name || '-'}
                                        {t.Stock?.RiceLevel ? ` (${t.Stock.RiceLevel.name})` : ''}
                                    </td>
                                    <td>
                                        <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>
                                            {t.FromFactory?.name || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                                            {t.ToFactory?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="text-right font-mono font-bold">{formatNumber(Number(t.quantity))} kg</td>
                                    <td className="hide-mobile font-mono text-secondary">{t.reference_number || '-'}</td>
                                    <td className="hide-mobile">{t.User?.fullname || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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

export default StockTransfers;
