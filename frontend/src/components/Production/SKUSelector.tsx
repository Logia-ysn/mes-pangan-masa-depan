import { useState, useEffect } from 'react';
import {
    riceVarietyApi,
    riceLevelApi,
    riceBrandApi,
    factoryMaterialApi
} from '../../services/api';
import api from '../../services/api';
import { logger } from '../../utils/logger';

interface SKUSelectorProps {
    value: string | number | null;
    onChange: (id: number, code: string, name: string) => void;
    idFactory: number | null;
    placeholder?: string;
    category?: 'FINISHED_RICE' | 'INTERMEDIATE' | 'RAW_MATERIAL';
}

interface ItemBase {
    id: number;
    code: string;
    name: string;
}

const SKUSelector = ({ value, onChange, idFactory, placeholder = "Pilih Produk...", category = 'FINISHED_RICE' }: SKUSelectorProps) => {
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [productTypes, setProductTypes] = useState<any[]>([]);

    // For new SKU creation
    const [varieties, setVarieties] = useState<ItemBase[]>([]);
    const [levels, setLevels] = useState<ItemBase[]>([]);
    const [brands, setBrands] = useState<ItemBase[]>([]);

    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedVariety, setSelectedVariety] = useState<number | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [idFactory, category]);

    const fetchInitialData = async () => {
        if (!idFactory) return;
        setLoading(true);
        try {
            // Fetch factory materials to get allowed product types
            const materialsRes = await factoryMaterialApi.getAll(idFactory);
            const materials = materialsRes.data?.data || [];

            // Filter by category and is_output (usually for SKU selection in production)
            const filteredTypes = materials
                .filter((m: any) => m.is_output && m.ProductType?.category === category)
                .map((m: any) => m.ProductType);

            setProductTypes(filteredTypes);

            // Fetch metadata for creating new SKUs
            const [varRes, levRes, braRes] = await Promise.all([
                riceVarietyApi.getAll(),
                riceLevelApi.getAll(),
                riceBrandApi.getAll(),
            ]);

            setVarieties(varRes.data || []);
            setLevels(levRes.data || []);
            setBrands(braRes.data || []);
        } catch (error) {
            logger.error('Error fetching SKU selector data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSKU = async () => {
        if (!selectedLevel || !selectedVariety || !idFactory) return;

        setSubmitting(true);
        try {
            const res = await api.post('/product-types/sku', {
                id_rice_level: selectedLevel,
                id_variety: selectedVariety,
                id_rice_brand: selectedBrand,
                id_factory: idFactory,
                category
            });

            const newProduct = res.data;
            // Refresh list or add new one
            setProductTypes(prev => [...prev, newProduct]);
            onChange(newProduct.id, newProduct.code, newProduct.name);
            setIsCreating(false);
            // Reset selection
            setSelectedLevel(null);
            setSelectedVariety(null);
            setSelectedBrand(null);
        } catch (error) {
            logger.error('Error creating SKU:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="animate-pulse h-10 bg-gray-100 rounded"></div>;

    return (
        <div className="sku-selector-container">
            {!isCreating ? (
                <div style={{ display: 'flex', gap: 8 }}>
                    <select
                        className="form-input form-select"
                        style={{
                            borderRadius: '12px',
                            border: '1.5px solid var(--border-color)',
                            background: 'var(--bg-surface)',
                            fontWeight: 500,
                            padding: '10px 16px',
                            minHeight: '46px',
                            fontSize: '0.9rem',
                            flex: 1
                        }}
                        value={value || ''}
                        onChange={(e) => {
                            const pt = productTypes.find(t => t.id === Number(e.target.value));
                            if (pt) onChange(pt.id, pt.code, pt.name);
                        }}
                    >
                        <option value="">{placeholder}</option>
                        {productTypes.map(pt => (
                            <option key={pt.id} value={pt.id}>
                                {pt.code} - {pt.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsCreating(true)}
                        style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid var(--border-color)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            padding: 0
                        }}
                        title="Buat SKU Baru"
                    >
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>add</span>
                    </button>
                </div>
            ) : (
                <div className="card" style={{
                    padding: '20px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    background: 'linear-gradient(to bottom, var(--bg-surface), var(--bg-body))',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>add_circle</span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Buat SKU Baru</h4>
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsCreating(false)} style={{ fontSize: '0.8rem' }}>Batal</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        {/* Level Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedLevel ? '0 0 0 2px rgba(59, 130, 246, 0.08)' : 'none',
                            borderColor: selectedLevel ? 'var(--primary)' : 'var(--border-color)'
                        }}>
                            <span className="material-symbols-outlined" style={{
                                color: selectedLevel ? 'var(--primary)' : 'var(--text-muted)',
                                fontVariationSettings: selectedLevel ? "'FILL' 1" : "'FILL' 0"
                            }}>layers</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>Level Beras</label>
                                <select
                                    className="form-select"
                                    style={{ border: 'none', padding: 0, height: 'auto', background: 'transparent', fontWeight: 500, fontSize: '0.9rem', width: '100%', outline: 'none' }}
                                    value={selectedLevel || ''}
                                    onChange={e => setSelectedLevel(Number(e.target.value))}
                                >
                                    <option value="">Pilih Level...</option>
                                    {levels.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Variety Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedVariety ? '0 0 0 2px rgba(59, 130, 246, 0.08)' : 'none',
                            borderColor: selectedVariety ? 'var(--primary)' : 'var(--border-color)'
                        }}>
                            <span className="material-symbols-outlined" style={{
                                color: selectedVariety ? 'var(--primary)' : 'var(--text-muted)',
                                fontVariationSettings: selectedVariety ? "'FILL' 1" : "'FILL' 0"
                            }}>potted_plant</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>Varietas PADI</label>
                                <select
                                    className="form-select"
                                    style={{ border: 'none', padding: 0, height: 'auto', background: 'transparent', fontWeight: 500, fontSize: '0.9rem', width: '100%', outline: 'none' }}
                                    value={selectedVariety || ''}
                                    onChange={e => setSelectedVariety(Number(e.target.value))}
                                >
                                    <option value="">Pilih Varietas...</option>
                                    {varieties.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Brand Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '12px 16px',
                            background: 'var(--bg-elevated)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedBrand ? '0 0 0 2px rgba(59, 130, 246, 0.08)' : 'none',
                            borderColor: selectedBrand ? 'var(--primary)' : 'var(--border-color)'
                        }}>
                            <span className="material-symbols-outlined" style={{
                                color: selectedBrand ? 'var(--primary)' : 'var(--text-muted)',
                                fontVariationSettings: selectedBrand ? "'FILL' 1" : "'FILL' 0"
                            }}>sell</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>Merk Beras (Opsional)</label>
                                <select
                                    className="form-select"
                                    style={{ border: 'none', padding: 0, height: 'auto', background: 'transparent', fontWeight: 500, fontSize: '0.9rem', width: '100%', outline: 'none' }}
                                    value={selectedBrand || ''}
                                    onChange={e => setSelectedBrand(Number(e.target.value))}
                                >
                                    <option value="">Pilih Merk...</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary w-full"
                        style={{ padding: '12px', borderRadius: '12px', fontWeight: 600, letterSpacing: '0.2px' }}
                        disabled={!selectedLevel || !selectedVariety || submitting}
                        onClick={handleCreateSKU}
                    >
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined icon-sm" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                                Memproses...
                            </span>
                        ) : 'Buat & Pilih SKU'}
                    </button>
                </div>
            )}
        </div>
    );
};

// SKUSelector is the main component

export default SKUSelector;
