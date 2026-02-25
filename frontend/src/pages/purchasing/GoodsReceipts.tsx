import { useState, useEffect, useCallback } from 'react';
import { goodsReceiptApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface GoodsReceiptRow {
    id: number;
    receipt_number: string;
    receipt_date: string;
    notes?: string;
    created_at: string;
    PurchaseOrder?: {
        id: number;
        po_number: string;
        Supplier?: { id: number; name: string };
    };
    User?: { id: number; fullname: string };
    GoodsReceiptItem?: {
        id: number;
        quantity_received: number;
        PurchaseOrderItem?: {
            ProductType?: { name: string };
            quantity: number;
            unit_price: number;
        };
    }[];
}

const GoodsReceipts = () => {
    const { showError } = useToast();
    const [receipts, setReceipts] = useState<GoodsReceiptRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await goodsReceiptApi.getAll({ limit, offset: page * limit });
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setReceipts(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setReceipts(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data penerimaan barang');
        } finally {
            setLoading(false);
        }
    }, [page, limit, showError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page-content">
            {/* Summary Cards */}
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL PENERIMAAN</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>BULAN INI</div>
                    <div className="text-2xl font-bold text-primary">
                        {receipts.filter(r => {
                            const d = new Date(r.receipt_date);
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                    </div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL ITEM</div>
                    <div className="text-2xl font-bold text-success">
                        {receipts.reduce((s, r) => s + (r.GoodsReceiptItem?.length || 0), 0)}
                    </div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>HALAMAN</div>
                    <div className="text-2xl font-bold">{page + 1} / {totalPages || 1}</div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Daftar Penerimaan Barang</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">No. Penerimaan</th>
                                <th className="text-left">Tanggal</th>
                                <th className="text-left">No. PO</th>
                                <th className="text-left">Supplier</th>
                                <th className="text-right">Item</th>
                                <th className="text-right">Total Qty</th>
                                <th className="text-left">Penerima</th>
                                <th className="text-left hide-mobile">Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : receipts.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>inventory_2</span>
                                    <div style={{ marginTop: 8 }}>Belum ada data penerimaan barang</div>
                                </td></tr>
                            ) : receipts.map(r => {
                                const totalQty = r.GoodsReceiptItem?.reduce((s, i) => s + Number(i.quantity_received), 0) || 0;
                                return (
                                    <tr key={r.id}>
                                        <td className="font-mono font-medium">{r.receipt_number}</td>
                                        <td>{formatDate(r.receipt_date)}</td>
                                        <td className="font-mono">{r.PurchaseOrder?.po_number || '-'}</td>
                                        <td>{r.PurchaseOrder?.Supplier?.name || '-'}</td>
                                        <td className="text-right">{r.GoodsReceiptItem?.length || 0}</td>
                                        <td className="text-right font-mono">{formatNumber(totalQty)} kg</td>
                                        <td>{r.User?.fullname || '-'}</td>
                                        <td className="hide-mobile text-secondary">{r.notes || '-'}</td>
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
                        <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                            {page + 1} dari {totalPages}
                        </span>
                        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                            <span className="material-symbols-outlined icon-sm">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoodsReceipts;
