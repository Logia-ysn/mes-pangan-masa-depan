import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Box, Filter } from 'lucide-react';
import { productTypeApi, riceVarietyApi, riceLevelApi, riceBrandApi } from '../../services/api';
import toast from 'react-hot-toast';

interface ProductType {
    id: number;
    code: string;
    name: string;
    description?: string;
    unit: string;
    category?: 'RAW_MATERIAL' | 'WIP' | 'FINISHED_GOOD' | 'PACKAGING' | 'BYPRODUCT';
    id_rice_brand?: number;
    id_rice_level?: number;
    id_variety?: number;
    RiceBrand?: { name: string };
    RiceLevel?: { name: string };
    RiceVariety?: { name: string };
}

export default function ProductTypes() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Master data for dropdowns
    const [varieties, setVarieties] = useState<{ id: number, name: string }[]>([]);
    const [levels, setLevels] = useState<{ id: number, name: string }[]>([]);
    const [brands, setBrands] = useState<{ id: number, name: string }[]>([]);

    const initialFormState = {
        code: '',
        name: '',
        description: '',
        unit: 'kg',
        category: 'FINISHED_GOOD',
        id_rice_brand: '',
        id_rice_level: '',
        id_variety: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
        loadMasterData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await productTypeApi.getAll();
            setProducts(res.data?.data || res.data || []);
        } catch (err: any) {
            toast.error('Gagal mengambil data produk');
        } finally {
            setLoading(false);
        }
    };

    const loadMasterData = async () => {
        try {
            const [varRes, levRes, brandRes] = await Promise.all([
                riceVarietyApi.getAll(),
                riceLevelApi.getAll(),
                riceBrandApi.getAll()
            ]);
            setVarieties(varRes.data?.data || varRes.data || []);
            setLevels(levRes.data?.data || levRes.data || []);
            setBrands(brandRes.data?.data || brandRes.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData };
            if (payload.id_rice_brand) payload.id_rice_brand = parseInt(payload.id_rice_brand);
            else delete payload.id_rice_brand;
            if (payload.id_rice_level) payload.id_rice_level = parseInt(payload.id_rice_level);
            else delete payload.id_rice_level;
            if (payload.id_variety) payload.id_variety = parseInt(payload.id_variety);
            else delete payload.id_variety;

            if (editingId) {
                await productTypeApi.update(editingId, payload);
                toast.success('Produk berhasil diupdate');
            } else {
                await productTypeApi.create(payload);
                toast.success('Produk berhasil ditambahkan');
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Hapus produk ${name}?`)) return;
        try {
            await productTypeApi.delete(id);
            toast.success('Produk dihapus');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Gagal menghapus produk');
        }
    };

    const openEditModal = (p: ProductType) => {
        setEditingId(p.id);
        setFormData({
            code: p.code,
            name: p.name,
            description: p.description || '',
            unit: p.unit || 'kg',
            category: p.category || 'FINISHED_GOOD',
            id_rice_brand: p.id_rice_brand?.toString() || '',
            id_rice_level: p.id_rice_level?.toString() || '',
            id_variety: p.id_variety?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryStyles = (category?: string) => {
        switch (category) {
            case 'FINISHED_GOOD':
                return 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200/50';
            case 'RAW_MATERIAL':
                return 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200/50';
            case 'WIP':
                return 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200/50';
            case 'PACKAGING':
                return 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200/50';
            case 'BYPRODUCT':
                return 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-700 border-slate-200/50';
            default:
                return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 p-6 rounded-2xl border border-white/60 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                        <Package className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Master Produk
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Kelola spesifikasi, varietas, dan tingkatan produk</p>
                    </div>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
                    Tambah Produk
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200/50 bg-white/40 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-72 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari kode atau nama produk..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Filter className="w-4 h-4" />
                        <span>Total: <strong className="text-slate-800">{filteredProducts.length}</strong> produk</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200/50">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wider">Kode</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Nama Produk</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Kategori</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Varietas</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Level</th>
                                <th className="px-6 py-4 font-semibold tracking-wider">Merk</th>
                                <th className="px-6 py-4 font-semibold tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                            <p className="font-medium animate-pulse">Memuat data produk...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                                                <Box className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-slate-500">Tidak ada produk ditemukan.</p>
                                            <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((p, index) => (
                                    <tr 
                                        key={p.id} 
                                        className="group hover:bg-blue-50/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                {p.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{p.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{p.unit}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border ${getCategoryStyles(p.category)}`}>
                                                {p.category?.replace('_', ' ') || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.RiceVariety ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    {p.RiceVariety.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.RiceLevel ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    {p.RiceLevel.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.RiceBrand ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                                    {p.RiceBrand.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button 
                                                    onClick={() => openEditModal(p)} 
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100/50 hover:text-blue-700 rounded-lg transition-colors" 
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(p.id, p.name)} 
                                                    className="p-1.5 text-red-600 hover:bg-red-100/50 hover:text-red-700 rounded-lg transition-colors" 
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    
                    <div className="relative bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 bg-white/50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                {editingId ? 'Edit Kredensial Produk' : 'Registrasi Produk Baru'}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Kode Produk <span className="text-rose-500">*</span></label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-mono text-sm uppercase" 
                                            value={formData.code} 
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                                            placeholder="PB-IR64-M" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Kategori <span className="text-rose-500">*</span></label>
                                        <select 
                                            required 
                                            className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                                            value={formData.category} 
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
                                            <option value="WIP">Barang Setengah Jadi (WIP)</option>
                                            <option value="FINISHED_GOOD">Produk Jadi (Finished Good)</option>
                                            <option value="PACKAGING">Kemasan (Packaging)</option>
                                            <option value="BYPRODUCT">Produk Sampingan (Byproduct)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Nama Produk <span className="text-rose-500">*</span></label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 text-sm" 
                                        value={formData.name} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        placeholder="Beras Putih IR64 Medium" 
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Spesifikasi Tambahan</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600">Satuan Dasar</label>
                                            <input 
                                                required 
                                                type="text" 
                                                className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                                                value={formData.unit} 
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600">Varietas Padi</label>
                                            <select 
                                                className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                                                value={formData.id_variety} 
                                                onChange={e => setFormData({ ...formData, id_variety: e.target.value })}
                                            >
                                                <option value="">- Tidak Ada -</option>
                                                {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600">Level / Grade</label>
                                            <select 
                                                className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                                                value={formData.id_rice_level} 
                                                onChange={e => setFormData({ ...formData, id_rice_level: e.target.value })}
                                            >
                                                <option value="">- Tidak Ada -</option>
                                                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-600">Merk / Brand</label>
                                            <select 
                                                className="w-full px-3 py-2 bg-white/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                                                value={formData.id_rice_brand} 
                                                onChange={e => setFormData({ ...formData, id_rice_brand: e.target.value })}
                                            >
                                                <option value="">- Tidak Ada -</option>
                                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Deskripsi Spesifikasi</label>
                                    <textarea 
                                        className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 text-sm resize-none" 
                                        rows={3} 
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        placeholder="Catatan tambahan spesifikasi produk..."
                                    ></textarea>
                                </div>
                            </form>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                form="productForm" 
                                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                            >
                                {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
