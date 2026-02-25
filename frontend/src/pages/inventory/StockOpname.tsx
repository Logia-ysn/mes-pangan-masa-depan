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
            <div className="page-header">
                <div className="page-title">
                    <h1>Stock Opname</h1>
                    <p className="text-secondary text-sm block" style={{ marginTop: '0.25rem' }}>
                        Lakukan perhitungan stok fisik. Sistem akan otomatis membuat penyesuaian (Adjustment).
                    </p>
                </div>
            </div>

            <div className="grid grid-3" style={{ gap: 24, alignItems: 'flex-start' }}>
                {/* Left Form: Configuration */}
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="card-title text-lg flex items-center" style={{ gap: 8, marginBottom: 20 }}>
                        <span className="material-symbols-outlined text-primary">domain</span>
                        Konfigurasi Opname
                    </h3>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">Lokasi Pabrik</label>
                        <select
                            className="form-control"
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

                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">Tanggal Pelaksanaan</label>
                        <input
                            type="date"
                            required
                            className="form-control"
                            value={opnameDate}
                            onChange={(e) => setOpnameDate(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label className="form-label">Keterangan (Opsional)</label>
                        <textarea
                            rows={3}
                            className="form-control"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Stok opname rutin bulan berjalan..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={isSubmitting || opnameItems.length === 0}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <><span className="material-symbols-outlined animate-spin icon-sm">sync</span> Menyimpan...</>
                        ) : (
                            <><span className="material-symbols-outlined icon-sm">save</span> Simpan Stock Opname</>
                        )}
                    </button>
                </div>

                {/* Right Table: Items List */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header" style={{ padding: 20, display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="card-title text-lg">Worksheet Perhitungan Fisik</h3>
                        {isLoadingStock && (
                            <span className="text-secondary text-sm flex items-center" style={{ gap: 4 }}>
                                <span className="material-symbols-outlined animate-spin icon-sm">sync</span>
                                Memuat data...
                            </span>
                        )}
                    </div>

                    <div className="table-container">
                        {selectedFactory === '' ? (
                            <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>warehouse</span>
                                <p>Silakan pilih lokasi pabrik di panel samping terlebih dahulu</p>
                            </div>
                        ) : stockItems.length === 0 && !isLoadingStock ? (
                            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>inventory_2</span>
                                <p>Tidak ada data stok (0 items) di pabrik ini.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th className="text-left" style={{ padding: '12px 16px' }}>Produk</th>
                                        <th className="text-right" style={{ padding: '12px 16px', width: 120 }}>Sistem (Kg)</th>
                                        <th className="text-right" style={{ padding: '12px 16px', width: 120 }}>Fisik (Kg)</th>
                                        <th className="text-right" style={{ padding: '12px 16px', width: 100 }}>Selisih</th>
                                        <th className="text-left" style={{ padding: '12px 16px' }}>Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opnameItems.map((item) => {
                                        const diffColor = item.difference > 0 ? '#10b981' : item.difference < 0 ? '#ef4444' : 'inherit';

                                        return (
                                            <tr key={item.id_stock} style={{ backgroundColor: item.difference !== 0 ? 'rgba(245, 158, 11, 0.05)' : '' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div className="font-bold">{item.name}</div>
                                                    <div className="text-xs text-secondary">{item.category}</div>
                                                </td>
                                                <td className="text-right font-mono" style={{ padding: '12px 16px' }}>
                                                    {formatNumber(item.system_quantity)}
                                                </td>
                                                <td style={{ padding: '8px 16px' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-control text-right"
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            borderColor: item.difference !== 0 ? 'var(--warning-color)' : ''
                                                        }}
                                                        value={item.actual_quantity}
                                                        onChange={(e) => handleActualQuantityChange(item.id_stock, e.target.value)}
                                                        disabled={isSubmitting}
                                                    />
                                                </td>
                                                <td className="text-right font-mono font-bold" style={{ padding: '12px 16px', color: diffColor }}>
                                                    {item.difference > 0 ? '+' : ''}{formatNumber(item.difference)}
                                                </td>
                                                <td style={{ padding: '8px 16px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control text-sm"
                                                        style={{ width: '100%', padding: '6px 10px' }}
                                                        value={item.notes}
                                                        onChange={(e) => handleNotesChange(item.id_stock, e.target.value)}
                                                        placeholder={item.difference !== 0 ? "Alasan selisih..." : ""}
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
