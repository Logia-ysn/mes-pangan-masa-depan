import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { stockApi } from '../../services/api';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import { formatDate, formatNumber } from '../../utils/formatUtils';
import LogoLoader from '../../components/UI/LogoLoader';

interface Stock {
    id: number;
    id_factory: number;
    id_product_type: number;
    quantity: number;
    quarantine_quantity: number;
    min_quantity: number;
    unit: string;
    last_updated: string;
    product_type?: {
        id: number;
        name: string;
        code: string;
        category: string;
        RiceVariety?: { code: string; name: string };
        RiceLevel?: { code: string; name: string };
        RiceBrand?: { code: string; name: string };
    };
    factory?: {
        name: string;
    };
}

interface ProductType {
    id: number;
    name: string;
    code: string;
    category: string;
    RiceVariety?: { code: string; name: string };
    RiceLevel?: { code: string; name: string };
    RiceBrand?: { code: string; name: string };
}

const Stocks = () => {
    const { theme } = useTheme();
    const { showSuccess, showError } = useToast();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        id_product_type: '',
        id_factory: 0 as number | string,
        quantity: '',
        min_quantity: '',
        unit: 'kg'
    });

    // Pagination & Factory hook
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const {
        selectedFactory,
        setSelectedFactory,
        factories,
        loading: factoryLoading
    } = useFactory();

    // Transfer Modal States
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [allStocks, setAllStocks] = useState<Stock[]>([]);
    const [transferForm, setTransferForm] = useState({
        fromFactoryId: 0,
        toFactoryId: 0,
        productCode: '',
        quantity: '',
        notes: ''
    });
    const [transferLoading, setTransferLoading] = useState(false);
    const [transfers, setTransfers] = useState<any[]>([]);

    useEffect(() => {
        if (!factoryLoading) {
            fetchData();
        }
    }, [selectedFactory, page, factoryLoading]);

    useEffect(() => {
        fetchTransfers();
    }, [selectedFactory]);

    const fetchTransfers = async () => {
        try {
            const res = await api.get('/stock-movements', {
                params: {
                    reference_type: 'TRANSFER',
                    limit: 10,
                    movement_type: 'OUT',
                    ...(selectedFactory ? { id_factory: selectedFactory } : {})
                }
            });
            setTransfers(res.data?.data || []);
        } catch (e) { logger.error(e); }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [stocksRes, productTypesRes] = await Promise.all([
                stockApi.getAll({
                    limit: ITEMS_PER_PAGE,
                    offset: (page - 1) * ITEMS_PER_PAGE,
                    id_factory: selectedFactory || undefined
                }),
                api.get('/product-types')
            ]);

            const stockData = stocksRes.data?.data || stocksRes.data || [];
            const total = stocksRes.data?.total || stockData.length;

            setStocks(stockData);
            setTotalItems(total);

            const ptData = productTypesRes.data?.data || productTypesRes.data || [];
            setProductTypes(Array.isArray(ptData) ? ptData : []);
        } catch (error) {
            logger.error('Error fetching stock data:', error);
            showError('Error', 'Gagal memuat data stok');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id_product_type: parseInt(formData.id_product_type),
                quantity: parseFloat(formData.quantity) || 0,
                min_quantity: parseFloat(formData.min_quantity) || 0,
                id_factory: selectedFactory || 1
            };

            if (editingStock) {
                await stockApi.update(editingStock.id, payload);
                showSuccess('Berhasil', 'Data stok berhasil diperbarui');
            } else {
                await stockApi.create(payload);
                showSuccess('Berhasil', 'Data stok baru berhasil ditambahkan');
            }
            fetchData();
            closeModal();
        } catch (error) {
            logger.error('Error saving stock:', error);
            showError('Gagal', 'Terjadi kesalahan saat menyimpan data');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus stok ini?')) {
            try {
                await stockApi.delete(id);
                showSuccess('Berhasil', 'Stok berhasil dihapus');
                fetchData();
            } catch (error) {
                logger.error('Error deleting stock:', error);
                showError('Gagal', 'Gagal menghapus stok');
            }
        }
    };

    const openModal = (stock?: Stock) => {
        if (stock) {
            setEditingStock(stock);
            setFormData({
                id_product_type: stock.id_product_type.toString(),
                id_factory: stock.id_factory,
                quantity: stock.quantity.toString(),
                min_quantity: (stock.min_quantity || '').toString(),
                unit: stock.unit || 'kg'
            });
        } else {
            setEditingStock(null);
            setFormData({
                id_product_type: productTypes[0]?.id?.toString() || '',
                id_factory: selectedFactory || (factories.length > 0 ? factories[0].id : 0),
                quantity: '',
                min_quantity: '100',
                unit: 'kg'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStock(null);
    };

    const openTransferModal = async (stock?: Stock) => {
        try {
            const res = await stockApi.getAll({ limit: 200 });
            setAllStocks(res.data.data || res.data || []);
        } catch (e) { logger.error(e); }

        if (stock) {
            setTransferForm({
                fromFactoryId: stock.id_factory,
                toFactoryId: factories.find(f => f.id !== stock.id_factory)?.id || 0,
                productCode: stock.product_type?.code || '',
                quantity: '',
                notes: ''
            });
        } else {
            setTransferForm({
                fromFactoryId: selectedFactory || (factories[0]?.id || 0),
                toFactoryId: factories.find(f => f.id !== selectedFactory)?.id || 0,
                productCode: '',
                quantity: '',
                notes: ''
            });
        }
        setShowTransferModal(true);
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (transferForm.fromFactoryId === transferForm.toFactoryId) {
            showError('Validasi', 'Pabrik asal dan tujuan tidak boleh sama');
            return;
        }
        if (!transferForm.productCode) {
            showError('Validasi', 'Pilih produk yang akan ditransfer');
            return;
        }
        const qty = parseFloat(transferForm.quantity);
        if (!qty || qty <= 0) {
            showError('Validasi', 'Jumlah transfer harus lebih dari 0');
            return;
        }

        setTransferLoading(true);
        try {
            await stockApi.transfer({
                fromFactoryId: transferForm.fromFactoryId,
                toFactoryId: transferForm.toFactoryId,
                productCode: transferForm.productCode,
                quantity: qty,
                notes: transferForm.notes || undefined
            });

            const fromFactory = factories.find(f => f.id === transferForm.fromFactoryId)?.name || 'Unknown';
            const toFactory = factories.find(f => f.id === transferForm.toFactoryId)?.name || 'Unknown';

            showSuccess('Transfer Berhasil',
                `${formatNumber(qty)} kg ${transferForm.productCode} berhasil ditransfer dari ${fromFactory} ke ${toFactory}`
            );

            setShowTransferModal(false);
            fetchData();
            fetchTransfers();
        } catch (error: any) {
            showError('Transfer Gagal', error.response?.data?.message || error.message);
        } finally {
            setTransferLoading(false);
        }
    };

    const getStockStatus = (stock: Stock) => {
        const minQty = stock.min_quantity || 100;
        if (stock.quantity <= 0) return { label: 'Habis', class: 'badge-error', icon: 'error' };
        if (stock.quantity <= minQty) return { label: 'Stok Rendah', class: 'badge-warning', icon: 'warning' };
        return { label: 'Tersedia', class: 'badge-success', icon: 'check_circle' };
    };

    const categories = ['all', ...new Set(productTypes.map(pt => pt.category).filter(Boolean))];

    const filteredStocks = filterCategory === 'all'
        ? stocks
        : stocks.filter(s => s.product_type?.category === filterCategory);

    const totalSKUs = totalItems;
    const lowStockCount = stocks.filter(s => s.quantity <= (s.min_quantity || 100) && s.quantity > 0).length;
    const outOfStockCount = stocks.filter(s => s.quantity <= 0).length;
    const totalValue = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

    const categoryDistribution = useMemo(() => {
        const dist = stocks.reduce((acc, curr) => {
            const cat = curr.product_type?.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + (curr.quantity || 0);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(dist).map(([name, value]) => ({ name, value }));
    }, [stocks]);

    const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--error)', '#8884d8'];
    const chartColors = {
        text: theme === 'dark' ? '#92adc9' : '#64748b',
        tooltipBg: theme === 'dark' ? '#182430' : '#ffffff',
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            {/* Factory Toggle */}
            <div className="factory-selector-scroll">
                <button
                    className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setSelectedFactory(null); setPage(1); }}
                >
                    <span className="material-symbols-outlined icon-sm">apps</span>
                    Semua
                </button>
                {factories.map(factory => (
                    <button
                        key={factory.id}
                        className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setSelectedFactory(factory.id); setPage(1); }}
                    >
                        <span className="material-symbols-outlined icon-sm">factory</span>
                        {factory.name}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total SKU</span>
                        <span className="material-symbols-outlined stat-card-icon">inventory_2</span>
                    </div>
                    <div className="stat-card-value">{formatNumber(totalSKUs)}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Stok Rendah</span>
                        <span className="material-symbols-outlined stat-card-icon">warning</span>
                    </div>
                    <div className="stat-card-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {lowStockCount}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Stok Habis</span>
                        <span className="material-symbols-outlined stat-card-icon">error</span>
                    </div>
                    <div className="stat-card-value" style={{ color: outOfStockCount > 0 ? 'var(--error)' : 'var(--success)' }}>
                        {outOfStockCount}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Volume (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">scale</span>
                    </div>
                    <div className="stat-card-value">{formatNumber(totalValue)}</div>
                    <span className="badge badge-info">kg</span>
                </div>
            </div>

            <div className="grid grid-2-1" style={{ marginTop: 24, alignItems: 'start' }}>
                {/* Stock Table */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Daftar Stok</h3>
                            <p className="card-subtitle">Kelola inventaris produk</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <select
                                className="form-input form-select"
                                style={{ width: 'auto', minWidth: 150 }}
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.filter(c => c !== 'all').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button className="btn btn-secondary" onClick={() => openTransferModal()}
                                style={{ background: 'var(--info)', color: 'white', border: 'none' }}>
                                <span className="material-symbols-outlined icon-sm">swap_horiz</span>
                                Transfer Stok
                            </button>
                            <button className="btn btn-primary" onClick={() => openModal()}>
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Tambah Stok
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <LogoLoader small text="Memuat data stok..." />
                    ) : filteredStocks.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <h3>Belum ada stok</h3>
                            <p>Tidak ditemukan data stok untuk filter ini</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Kode</th>
                                            <th>Produk</th>
                                            <th className="hide-mobile">Kategori</th>
                                            <th>Stok Saat Ini</th>
                                            <th>Karantina</th>
                                            <th className="hide-mobile">Min. Stok</th>
                                            <th>Status</th>
                                            <th className="hide-mobile">Terakhir Update</th>
                                            <th style={{ textAlign: 'right' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map((stock) => {
                                            const status = getStockStatus(stock);
                                            const productType = productTypes.find(pt => pt.id === stock.id_product_type);
                                            return (
                                                <tr key={stock.id}>
                                                    <td>
                                                        <span className="font-mono font-bold">
                                                            {stock.product_type?.code || productType?.code || `STK-${stock.id}`}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium">
                                                            {stock.product_type?.name || productType?.name || `Product #${stock.id_product_type}`}
                                                        </div>
                                                        {(stock.product_type?.RiceVariety || stock.product_type?.RiceLevel || stock.product_type?.RiceBrand) && (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                                                                {stock.product_type?.RiceLevel && (
                                                                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{stock.product_type.RiceLevel.name}</span>
                                                                )}
                                                                {stock.product_type?.RiceVariety && (
                                                                    <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{stock.product_type.RiceVariety.name}</span>
                                                                )}
                                                                {stock.product_type?.RiceBrand && (
                                                                    <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{stock.product_type.RiceBrand.name}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="hide-mobile">
                                                        <span className="badge badge-muted">
                                                            {stock.product_type?.category || productType?.category || 'Umum'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="font-mono font-bold" style={{
                                                            color: stock.quantity <= 0 ? 'var(--error)' :
                                                                stock.quantity <= (stock.min_quantity || 100) ? 'var(--warning)' : 'var(--text-primary)'
                                                        }}>
                                                            {formatNumber(stock.quantity)} {stock.unit}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {stock.quarantine_quantity > 0 ? (
                                                            <span className="badge badge-warning">{formatNumber(stock.quarantine_quantity)} {stock.unit}</span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td className="hide-mobile font-mono">{formatNumber(stock.min_quantity || 100)} {stock.unit}</td>
                                                    <td>
                                                        <span className={`badge ${status.class}`}>
                                                            <span className="material-symbols-outlined icon-sm">{status.icon}</span>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="hide-mobile" style={{ color: 'var(--text-muted)' }}>{formatDate(stock.last_updated)}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => openTransferModal(stock)}
                                                                title="Transfer ke pabrik lain">
                                                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--info)' }}>swap_horiz</span>
                                                            </button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => openModal(stock)}>
                                                                <span className="material-symbols-outlined icon-sm">edit</span>
                                                            </button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(stock.id)}>
                                                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                totalItems={totalItems}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </>
                    )}
                </div>

                {/* Inventory Distribution Chart */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-header">
                        <h3 className="card-title">Distribusi Inventaris</h3>
                        <p className="card-subtitle">Berdasarkan kategori</p>
                    </div>
                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: chartColors.tooltipBg,
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8
                                    }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span style={{ color: chartColors.text }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Transfers Card */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3 className="card-title">
                        <span className="material-symbols-outlined" style={{ marginRight: 8, verticalAlign: 'bottom' }}>history</span>
                        Riwayat Transfer Terbaru
                    </h3>
                </div>
                {transfers.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada riwayat transfer.
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Produk</th>
                                    <th>Jumlah</th>
                                    <th>Dari</th>
                                    <th>Ke</th>
                                    <th>Catatan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((t: any) => {
                                    let notesObj: any = {};
                                    try { notesObj = JSON.parse(t.notes || '{}'); } catch (e) { }
                                    const toFactoryName = factories.find(f => f.id === notesObj.toFactory)?.name || `Factory #${notesObj.toFactory}`;
                                    const fromFactoryName = t.Stock?.Factory?.name || t.factory?.name || '-';

                                    return (
                                        <tr key={t.id}>
                                            <td>{formatDate(t.created_at)}</td>
                                            <td><span className="font-mono font-bold">{notesObj.productCode || '-'}</span></td>
                                            <td><span className="font-mono">{formatNumber(t.quantity)} kg</span></td>
                                            <td>{fromFactoryName}</td>
                                            <td>{toFactoryName}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{notesObj.userNotes || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingStock ? 'Edit Stok' : 'Tambah Stok Baru'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Produk</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.id_product_type}
                                        onChange={(e) => setFormData({ ...formData, id_product_type: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Produk</option>
                                        {productTypes.map((pt) => (
                                            <option key={pt.id} value={pt.id}>{pt.code} - {pt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Jumlah Stok</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            placeholder="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Minimum Stok</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.min_quantity}
                                            onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                                            placeholder="100"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Satuan</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="kg">Kilogram (kg)</option>
                                        <option value="ton">Ton</option>
                                        <option value="sak">Sak</option>
                                        <option value="karung">Karung</option>
                                        <option value="pcs">Pieces (pcs)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    {editingStock ? 'Simpan Perubahan' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ marginRight: 8, color: 'var(--info)', verticalAlign: 'bottom' }}>swap_horiz</span>
                                Transfer Stok Antar Pabrik
                            </h3>
                            <button className="modal-close" onClick={() => setShowTransferModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleTransfer}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Dari Pabrik</label>
                                        <select
                                            className="form-input form-select"
                                            value={transferForm.fromFactoryId}
                                            onChange={(e) => setTransferForm({ ...transferForm, fromFactoryId: parseInt(e.target.value) })}
                                            required
                                        >
                                            <option value={0}>Pilih Pabrik Asal</option>
                                            {factories.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ paddingBottom: 8 }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: 28 }}>arrow_forward</span>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Ke Pabrik</label>
                                        <select
                                            className="form-input form-select"
                                            value={transferForm.toFactoryId}
                                            onChange={(e) => setTransferForm({ ...transferForm, toFactoryId: parseInt(e.target.value) })}
                                            required
                                        >
                                            <option value={0}>Pilih Pabrik Tujuan</option>
                                            {factories.filter(f => f.id !== transferForm.fromFactoryId).map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Produk</label>
                                    <select
                                        className="form-input form-select"
                                        value={transferForm.productCode}
                                        onChange={(e) => setTransferForm({ ...transferForm, productCode: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Produk</option>
                                        {allStocks
                                            .filter(s => s.id_factory === transferForm.fromFactoryId && s.quantity > 0)
                                            .map(s => (
                                                <option key={s.id} value={s.product_type?.code || ''}>
                                                    {s.product_type?.code} - {s.product_type?.name}
                                                    {s.product_type?.RiceVariety ? ` (${s.product_type.RiceVariety.name})` : ''}
                                                    - {formatNumber(s.quantity)} {s.unit}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Jumlah Transfer (kg)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={transferForm.quantity}
                                        onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                                        placeholder="0"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Catatan (opsional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={transferForm.notes}
                                        onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                                        placeholder="Contoh: Transfer untuk proses poles"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={transferLoading}>
                                    {transferLoading ? 'Memproses...' : 'Kirim Transfer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stocks;
