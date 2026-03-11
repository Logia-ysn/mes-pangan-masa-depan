import React, { useState, useEffect } from 'react';
import { stockOpnameApi, factoryApi, stockApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Factory {
    id: number;
    name: string;
}

interface StockItem {
    id: number;
    id_product_type: number;
    quantity: string | number;
    ProductType: {
        name: string;
        category: string;
    };
}

interface OpnameItem {
    id_stock: number;
    name: string;
    category: string;
    system_quantity: number;
    actual_quantity: number;
    difference: number;
    notes: string;
}

export default function StockOpnamePage() {
    const { showSuccess, showError } = useToast();
    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | ''>('');
    const [opnameDate, setOpnameDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [opnameItems, setOpnameItems] = useState<OpnameItem[]>([]);

    const [isLoadingFactories, setIsLoadingFactories] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadFactories();
    }, []);

    useEffect(() => {
        if (selectedFactory) {
            loadStock(Number(selectedFactory));
        } else {
            setStockItems([]);
            setOpnameItems([]);
        }
    }, [selectedFactory]);

    const loadFactories = async () => {
        setIsLoadingFactories(true);
        try {
            const response = await factoryApi.getAll();
            setFactories(response.data?.data || response.data);
        } catch (error) {
            showError('Gagal', 'Gagal memuat daftar pabrik');
        } finally {
            setIsLoadingFactories(false);
        }
    };

    const loadStock = async (factoryId: number) => {
        setIsLoadingStock(true);
        try {
            const response = await stockApi.getAll({ id_factory: factoryId, limit: 1000 });
            const items: StockItem[] = response.data?.data || response.data;
            setStockItems(items);

            const initialOpnameItems: OpnameItem[] = items.map(item => ({
                id_stock: item.id,
                name: item.ProductType?.name || 'Unknown',
                category: item.ProductType?.category || 'Unknown',
                system_quantity: Number(item.quantity) || 0,
                actual_quantity: Number(item.quantity) || 0,
                difference: 0,
                notes: ''
            }));
            setOpnameItems(initialOpnameItems);
        } catch (error) {
            showError('Gagal', 'Gagal memuat data stok');
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleActualQuantityChange = (id_stock: number, value: string) => {
        const actual = value === '' ? 0 : Number(value);
        setOpnameItems(prev => prev.map(item => {
            if (item.id_stock === id_stock) {
                return {
                    ...item,
                    actual_quantity: actual,
                    difference: actual - item.system_quantity
                };
            }
            return item;
        }));
    };

    const handleNotesChange = (id_stock: number, value: string) => {
        setOpnameItems(prev => prev.map(item => {
            if (item.id_stock === id_stock) {
                return { ...item, notes: value };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFactory) return;

        setIsSubmitting(true);

        try {
            await stockOpnameApi.create({
                id_factory: Number(selectedFactory),
                opname_date: opnameDate,
                notes: notes,
                items: opnameItems.map(item => ({
                    id_stock: item.id_stock,
                    system_quantity: item.system_quantity,
                    actual_quantity: item.actual_quantity,
                    notes: item.notes
                }))
            });

            showSuccess('Berhasil', 'Data Stock Opname berhasil disimpan dan stok telah diperbarui.');
            loadStock(Number(selectedFactory));
            setNotes('');
        } catch (error: any) {
            showError('Gagal', error.response?.data?.message || 'Gagal menyimpan data Stock Opname');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--warning), #f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inventory_2</span>
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Stock Opname</h1>
                        <p className="page-subtitle">Lakukan perhitungan stok fisik. Sistem akan otomatis membuat penyesuaian (Adjustment).</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
                {/* Left Form: Configuration */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                        <span className="material-symbols-outlined text-warning" style={{ fontSize: 20 }}>settings_applications</span>
                        Konfigurasi Opname
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                        <div>
                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2">Lokasi Pabrik</label>
                            <select
                                className="form-control"
                                style={{ background: 'var(--bg-surface)', border: 'none' }}
                                value={selectedFactory}
                                onChange={(e) => setSelectedFactory(e.target.value ? Number(e.target.value) : '')}
                                disabled={isLoadingFactories || isSubmitting}
                            >
                                <option value="">-- Pilih Pabrik --</option>
                                {factories.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2">Tanggal Pelaksanaan</label>
                            <input
                                type="date"
                                required
                                className="form-control"
                                style={{ background: 'var(--bg-surface)', border: 'none' }}
                                value={opnameDate}
                                onChange={(e) => setOpnameDate(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 tracking-widest uppercase block mb-2">Keterangan</label>
                            <textarea
                                rows={4}
                                className="form-control"
                                style={{ background: 'var(--bg-surface)', border: 'none', resize: 'none' }}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Contoh: Stok opname rutin bulan berjalan..."
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                            width: '100%', justifyContent: 'center', height: 48,
                            background: 'linear-gradient(135deg, var(--warning), #f59e0b)', border: 'none'
                        }}
                        disabled={isSubmitting || opnameItems.length === 0}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <><span className="material-symbols-outlined animate-spin icon-sm mr-2">sync</span> Menyimpan...</>
                        ) : (
                            <><span className="material-symbols-outlined icon-sm mr-2">save</span> Simpan Perhitungan</>
                        )}
                    </button>
                </div>

                {/* Right Table: Items List */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Worksheet Perhitungan Fisik</h3>
                        {isLoadingStock && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="material-symbols-outlined animate-spin icon-sm">sync</span>
                                DATA SYNCING...
                            </span>
                        )}
                    </div>

                    <div className="table-responsive">
                        {selectedFactory === '' ? (
                            <div style={{ padding: '100px 24px', textAlign: 'center' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                                    color: 'var(--text-muted)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 40 }}>warehouse</span>
                                </div>
                                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Tentukan Lokasi</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Silakan pilih lokasi pabrik di panel samping untuk memulai perhitungan.</p>
                            </div>
                        ) : stockItems.length === 0 && !isLoadingStock ? (
                            <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                                    color: 'var(--text-muted)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 40 }}>inventory_2</span>
                                </div>
                                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Gudang Kosong</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Tidak ada data stok (0 items) ditemukan di pabrik ini.</p>
                            </div>
                        ) : (
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 24 }}>Produk & Kategori</th>
                                        <th style={{ textAlign: 'right' }}>Sistem (Kg)</th>
                                        <th style={{ textAlign: 'center', width: 140 }}>Fisik (Kg)</th>
                                        <th style={{ textAlign: 'right', width: 120 }}>Selisih</th>
                                        <th style={{ paddingRight: 24 }}>Catatan Perubahan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opnameItems.map((item) => {
                                        const isDiff = item.difference !== 0;
                                        return (
                                            <tr key={item.id_stock} className="premium-row" style={{ background: isDiff ? 'rgba(245, 158, 11, 0.03)' : '' }}>
                                                <td style={{ paddingLeft: 24 }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{item.category}</div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                        {formatNumber(item.system_quantity)}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-control"
                                                        style={{
                                                            width: '100px',
                                                            textAlign: 'right',
                                                            padding: '6px 10px',
                                                            background: 'var(--bg-surface)',
                                                            border: isDiff ? '1px solid var(--warning)' : '1px solid var(--border-subtle)',
                                                            fontSize: 13, fontWeight: 700, margin: '0 auto'
                                                        }}
                                                        value={item.actual_quantity}
                                                        onChange={(e) => handleActualQuantityChange(item.id_stock, e.target.value)}
                                                        disabled={isSubmitting}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        fontWeight: 800,
                                                        color: item.difference > 0 ? 'var(--success)' : item.difference < 0 ? 'var(--error)' : 'var(--text-muted)',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {item.difference > 0 ? '+' : ''}{formatNumber(item.difference)}
                                                    </div>
                                                </td>
                                                <td style={{ paddingRight: 24 }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        style={{
                                                            width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)',
                                                            fontSize: 12, borderRadius: 0, padding: '4px 0'
                                                        }}
                                                        value={item.notes}
                                                        onChange={(e) => handleNotesChange(item.id_stock, e.target.value)}
                                                        placeholder={isDiff ? "Alasan selisih..." : "Tambahkan catatan..."}
                                                        disabled={isSubmitting}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
