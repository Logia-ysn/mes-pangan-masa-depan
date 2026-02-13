import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Header from '../../components/Layout/Header';
import { stockApi } from '../../services/api';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface Stock {
    id: number;
    id_factory: number;
    id_product_type: number;
    quantity: number;
    min_quantity: number;
    unit: string;
    last_updated: string;
    product_type?: {
        id: number;
        name: string;
        code: string;
        category: string;
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
}

const Stocks = () => {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [formData, setFormData] = useState({
        id_product_type: '',
        quantity: '',
        min_quantity: '',
        unit: 'kg'
    });
    const { theme } = useTheme();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stocksRes, productTypesRes] = await Promise.all([
                stockApi.getAll({ limit: 100 }),
                api.get('/product-types')
            ]);
            setStocks(stocksRes.data.data || stocksRes.data || []);
            const ptData = productTypesRes.data?.data || productTypesRes.data || [];
            setProductTypes(Array.isArray(ptData) ? ptData : []);
        } catch (error) {
            logger.error('Error:', error);
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
                id_factory: 1
            };

            if (editingStock) {
                await stockApi.update(editingStock.id, payload);
            } else {
                await stockApi.create(payload);
            }
            fetchData();
            closeModal();
        } catch (error) {
            logger.error('Error saving stock:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus stok ini?')) {
            try {
                await stockApi.delete(id);
                fetchData();
            } catch (error) {
                logger.error('Error deleting stock:', error);
            }
        }
    };

    const openModal = (stock?: Stock) => {
        if (stock) {
            setEditingStock(stock);
            setFormData({
                id_product_type: stock.id_product_type?.toString() || '',
                quantity: stock.quantity?.toString() || '',
                min_quantity: stock.min_quantity?.toString() || '',
                unit: stock.unit || 'kg'
            });
        } else {
            setEditingStock(null);
            setFormData({
                id_product_type: productTypes[0]?.id?.toString() || '',
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

    const formatNumber = (num: number) =>
        new Intl.NumberFormat('id-ID').format(num);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStockStatus = (stock: Stock) => {
        const minQty = stock.min_quantity || 100;
        if (stock.quantity <= 0) return { label: 'Habis', class: 'badge-error', icon: 'error' };
        if (stock.quantity <= minQty) return { label: 'Stok Rendah', class: 'badge-warning', icon: 'warning' };
        return { label: 'Tersedia', class: 'badge-success', icon: 'check_circle' };
    };

    // Categories from product types
    const categories = ['all', ...new Set(productTypes.map(pt => pt.category).filter(Boolean))];

    // Filter stocks
    const filteredStocks = filterCategory === 'all'
        ? stocks
        : stocks.filter(s => s.product_type?.category === filterCategory);

    // Stats
    const totalSKUs = stocks.length;
    const lowStockCount = stocks.filter(s => s.quantity <= (s.min_quantity || 100) && s.quantity > 0).length;
    const outOfStockCount = stocks.filter(s => s.quantity <= 0).length;
    const totalValue = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Chart Data: Distribution by Category
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

    return (
        <>
            <Header title="Stok & Inventory" subtitle="Kelola stok produk dan bahan baku" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total SKU</span>
                            <span className="material-symbols-outlined stat-card-icon">inventory_2</span>
                        </div>
                        <div className="stat-card-value">{totalSKUs}</div>
                        <span className="badge badge-muted">Produk</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Stok Rendah</span>
                            <span className="material-symbols-outlined stat-card-icon">warning</span>
                        </div>
                        <div className="stat-card-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                            {lowStockCount}
                        </div>
                        <span className={`badge ${lowStockCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                            {lowStockCount > 0 ? 'Perlu Restock' : 'Aman'}
                        </span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Stok Habis</span>
                            <span className="material-symbols-outlined stat-card-icon">error</span>
                        </div>
                        <div className="stat-card-value" style={{ color: outOfStockCount > 0 ? 'var(--error)' : 'var(--success)' }}>
                            {outOfStockCount}
                        </div>
                        <span className={`badge ${outOfStockCount > 0 ? 'badge-error' : 'badge-success'}`}>
                            {outOfStockCount > 0 ? 'Urgent!' : 'OK'}
                        </span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Stok</span>
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
                            <div style={{ display: 'flex', gap: 12 }}>
                                {/* Category Filter */}
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
                                <button className="btn btn-primary" onClick={() => openModal()}>
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Tambah Stok
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                </div>
                                <h3>Memuat data...</h3>
                            </div>
                        ) : filteredStocks.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <h3>Belum ada stok</h3>
                                <p>Klik tombol "Tambah Stok" untuk menambahkan data inventaris</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Kode</th>
                                            <th>Produk</th>
                                            <th className="hide-mobile">Kategori</th>
                                            <th>Stok Saat Ini</th>
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
            </div>

            {/* Modal */}
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
        </>
    );
};

export default Stocks;
