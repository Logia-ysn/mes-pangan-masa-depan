import { useState, useEffect } from 'react';
import { factoryMaterialApi, productTypeApi, factoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';

const FactoryMaterialConfig = () => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [factories, setFactories] = useState<any[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
    const [productTypes, setProductTypes] = useState<any[]>([]);
    const [factoryMaterials, setFactoryMaterials] = useState<any>({ inputs: [], outputs: [] });

    useEffect(() => {
        fetchFactories();
        fetchProductTypes();
    }, []);

    useEffect(() => {
        if (selectedFactory) fetchFactoryMaterials();
    }, [selectedFactory]);

    const fetchFactories = async () => {
        try {
            const res = await factoryApi.getAll();
            const list = res.data?.data || [];
            setFactories(list);
            if (list.length > 0 && !selectedFactory) setSelectedFactory(list[0].id);
        } catch (e) { logger.error(e); }
    };

    const fetchProductTypes = async () => {
        try {
            const res = await productTypeApi.getAll({ limit: 200, isActive: true });
            setProductTypes(res.data?.data || []);
        } catch (e) { logger.error(e); }
    };

    const fetchFactoryMaterials = async () => {
        if (!selectedFactory) return;
        setLoading(true);
        try {
            const res = await factoryMaterialApi.getAll(selectedFactory);
            setFactoryMaterials(res.data || { inputs: [], outputs: [] });
        } catch (e) { logger.error(e); }
        finally { setLoading(false); }
    };

    const handleToggle = async (id_product_type: number, type: 'is_input' | 'is_output') => {
        if (!selectedFactory) return;

        const isInput = type === 'is_input'
            ? !factoryMaterials.inputs.some((p: any) => p.id === id_product_type)
            : factoryMaterials.inputs.some((p: any) => p.id === id_product_type);

        const isOutput = type === 'is_output'
            ? !factoryMaterials.outputs.some((p: any) => p.id === id_product_type)
            : factoryMaterials.outputs.some((p: any) => p.id === id_product_type);

        try {
            await factoryMaterialApi.upsert({
                id_factory: selectedFactory,
                id_product_type,
                is_input: isInput,
                is_output: isOutput
            });
            fetchFactoryMaterials();
            showSuccess("Berhasil", "Konfigurasi diperbarui");
        } catch (error: any) {
            showError("Gagal", error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Konfigurasi Material per Pabrik</h3>
                <p className="card-subtitle">Tentukan material apa saja yang bisa menjadi Input atau Output di setiap pabrik.</p>
            </div>

            <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ maxWidth: 300, marginBottom: 0 }}>
                    <label className="form-label">Pilih Pabrik</label>
                    <select
                        className="form-input"
                        value={selectedFactory || ''}
                        onChange={e => setSelectedFactory(Number(e.target.value))}
                    >
                        {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ padding: 24 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Kategori</th>
                            <th>Kode SKU</th>
                            <th>Nama Material</th>
                            <th style={{ textAlign: 'center', width: 100 }}>Input</th>
                            <th style={{ textAlign: 'center', width: 100 }}>Output</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productTypes.map(pt => {
                            const isInput = factoryMaterials.inputs.some((p: any) => p.id === pt.id);
                            const isOutput = factoryMaterials.outputs.some((p: any) => p.id === pt.id);

                            return (
                                <tr key={pt.id}>
                                    <td><span className="badge badge-secondary">{pt.category || 'OTHER'}</span></td>
                                    <td><code>{pt.code}</code></td>
                                    <td>{pt.name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={isInput}
                                            onChange={() => handleToggle(pt.id, 'is_input')}
                                            disabled={loading}
                                        />
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={isOutput}
                                            onChange={() => handleToggle(pt.id, 'is_output')}
                                            disabled={loading}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FactoryMaterialConfig;
