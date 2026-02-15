import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

import api, { worksheetApi, stockApi, factoryApi, machineApi, employeeApi, processCategoryApi, outputProductApi } from '../../services/api';
import { formatNumber, formatCurrency } from '../../utils/formatUtils';
import { logger } from '../../utils/logger';

// --- Interfaces ---

interface Factory {
    id: number;
    code: string;
    name: string;
}

interface Machine {
    id: number;
    name: string;
    id_factory: number;
    id_process_category?: number;
}

interface Employee {
    id: number;
    fullname: string;
    position: string;
}

interface Stock {
    id: number;
    id_factory: number;
    id_product_type: number;
    quantity: number;
    unit: string;
    ProductType?: { id: number; code: string; name: string };
    Factory?: { id: number; code: string; name: string };
}

interface ProcessCategory {
    id: number;
    code: string;
    name: string;
    is_main_process: boolean;
}

interface OutputProduct {
    id: number;
    code: string;
    name: string;
    id_factory: number;
}

interface InputBatch {
    id_stock: number;
    stock_name: string;  // "BTC-2026-001 - Gabah Kering Panen"
    quantity: number;
    unit_price: number;
    batch_id?: string;   // "BTC-2026-001" (untuk traceability)
}

interface SideProduct {
    product_code: string;
    product_name: string;
    quantity: number;
    is_auto: boolean;
    unit_price: number;
}

// --- Configs ---

const shiftConfig: { [key: string]: { label: string; class: string } } = {
    SHIFT_1: { label: 'Shift 1', class: 'badge-info' },
    SHIFT_2: { label: 'Shift 2', class: 'badge-warning' },
    SHIFT_3: { label: 'Shift 3', class: 'badge-muted' },
    SHIFT_4: { label: 'Shift 4', class: 'badge-success' }
};

const sideProductConfig: { PMD1: { code: string; name: string; defaultPercentage: number; isAuto?: boolean }[]; PMD2: { code: string; name: string; defaultPercentage: number; isAuto?: boolean }[] } = {
    PMD1: [
        { code: 'BEKATUL', name: 'Bekatul', defaultPercentage: 0 },
        { code: 'SEKAM', name: 'Sekam', defaultPercentage: 15, isAuto: true },
    ],
    PMD2: [
        { code: 'BEKATUL', name: 'Bekatul', defaultPercentage: 0 },
        { code: 'BROKEN', name: 'Broken', defaultPercentage: 0 },
        { code: 'REJECT', name: 'Reject', defaultPercentage: 0 },
        { code: 'MENIR_JITAY', name: 'Menir Jitay', defaultPercentage: 0 },
        { code: 'MENIR_GULA', name: 'Menir Gula', defaultPercentage: 0 },
    ]
};

// --- Main Component ---

const WorksheetForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { showSuccess, showError } = useToast();

    // Reference data
    const [factories, setFactories] = useState<Factory[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [processCategories, setProcessCategories] = useState<ProcessCategory[]>([]);
    const [outputProducts, setOutputProducts] = useState<OutputProduct[]>([]);

    // UI state
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showAddOperatorModal, setShowAddOperatorModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        worksheet_date: new Date().toISOString().split('T')[0],
        shift: '',
        id_output_product: '',
        selected_processes: [] as string[],
        selected_machines: [] as number[],
        batch_code: '',
        input_batches: [] as InputBatch[],
        beras_output: '',
        side_products: [] as SideProduct[],
        selected_operators: [] as number[],
        production_cost: '',
    });

    const [newOperator, setNewOperator] = useState({
        fullname: '',
        position: 'Operator',
        phone: ''
    });

    // --- Computed values ---

    const totalInputWeight = useMemo(() =>
        formData.input_batches.reduce((sum, b) => sum + b.quantity, 0),
        [formData.input_batches]
    );

    const berasOutput = useMemo(() =>
        parseFloat(formData.beras_output) || 0,
        [formData.beras_output]
    );

    const hppCalc = useMemo(() => {
        const productionCost = parseFloat(formData.production_cost) || 0;
        const rawMaterialCost = formData.input_batches.reduce((sum, b) => sum + (b.quantity * b.unit_price), 0);
        const sideProductRevenue = formData.side_products.reduce((sum, sp) => sum + (sp.quantity * sp.unit_price), 0);
        return {
            productionCost,
            rawMaterialCost,
            sideProductRevenue,
            hpp: productionCost + rawMaterialCost - sideProductRevenue
        };
    }, [formData.production_cost, formData.input_batches, formData.side_products]);

    const yieldPercentage = useMemo(() =>
        totalInputWeight > 0 ? ((berasOutput / totalInputWeight) * 100).toFixed(1) : '0',
        [berasOutput, totalInputWeight]
    );

    const selectedFactoryData = useMemo(() =>
        factories.find(f => f.id === selectedFactory),
        [factories, selectedFactory]
    );

    // --- Data fetching ---

    useEffect(() => {
        const init = async () => {
            try {
                const [factRes, machRes, empRes, procRes] = await Promise.all([
                    factoryApi.getAll(),
                    machineApi.getAll(),
                    employeeApi.getAll(),
                    processCategoryApi.getAll({ is_main_process: true }),
                ]);

                const allFactories = factRes.data?.data || factRes.data || [];
                const pmdFactories = allFactories.filter((f: Factory) => f.code.startsWith('PMD'));
                setFactories(pmdFactories);
                setMachines(machRes.data?.data || []);
                setEmployees(empRes.data?.data || []);
                setProcessCategories(procRes.data?.data || []);

                // Set default factory
                if (!isEditMode && pmdFactories.length > 0) {
                    const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
                    setSelectedFactory(pmd1?.id || pmdFactories[0].id);
                }
            } catch (error) {
                logger.error('Error loading reference data:', error);
                showError('Gagal', 'Gagal memuat data referensi');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Fetch stocks & output products when factory changes
    useEffect(() => {
        if (!selectedFactory) return;

        const fetchFactoryData = async () => {
            try {
                const [stockRes, outputRes] = await Promise.all([
                    stockApi.getAll({ id_factory: selectedFactory }),
                    outputProductApi.getAll({ id_factory: selectedFactory }),
                ]);
                setStocks(stockRes.data?.data || []);
                setOutputProducts(outputRes.data?.data || []);
            } catch (error) {
                logger.error('Error loading factory data:', error);
            }
        };
        fetchFactoryData();

        // Initialize side products for this factory (only in create mode or when factory changes)
        if (!isEditMode) {
            initializeSideProducts(selectedFactory);
        }
    }, [selectedFactory]);

    // Load worksheet for edit mode
    useEffect(() => {
        if (!isEditMode || factories.length === 0) return;

        const loadWorksheet = async () => {
            try {
                setLoading(true);
                const res = await worksheetApi.getById(Number(id));
                const ws = res.data;

                setSelectedFactory(ws.id_factory);

                setFormData({
                    worksheet_date: new Date(ws.worksheet_date).toISOString().split('T')[0],
                    shift: ws.shift,
                    id_output_product: (ws.OutputProduct || ws.otm_id_output_product)?.id
                        ? String((ws.OutputProduct || ws.otm_id_output_product).id) : '',
                    selected_processes: ws.process_steps ? JSON.parse(ws.process_steps) : [],
                    selected_machines: ws.id_machines ? JSON.parse(ws.id_machines) : (ws.id_machine ? [ws.id_machine] : []),
                    selected_operators: ws.id_operators ? JSON.parse(ws.id_operators) : (ws.notes?.includes('Operator ID:') ? [parseInt(ws.notes.split('Operator ID: ')[1])] : []),
                    batch_code: ws.batch_code || '',
                    input_batches: (ws.WorksheetInputBatch || ws.input_batches || []).map((b: any) => {
                        const stock = b.Stock || b.otm_id_stock;
                        return {
                            id_stock: stock?.id || b.id_stock,
                            stock_name: stock?.ProductType?.name
                                || stock?.otm_id_product_type?.name
                                || 'Unknown',
                            quantity: Number(b.quantity),
                            unit_price: Number(b.unit_price || 0)
                        };
                    }),
                    beras_output: String(ws.beras_output),
                    side_products: (ws.side_products || []).map((sp: any) => ({
                        product_code: sp.product_code,
                        product_name: sp.product_name,
                        quantity: Number(sp.quantity),
                        is_auto: sp.is_auto_calculated,
                        unit_price: Number(sp.unit_price || 0)
                    })),
                    production_cost: String(ws.production_cost || 0),
                });
            } catch (error) {
                logger.error('Error loading worksheet:', error);
                showError('Gagal', 'Gagal memuat data worksheet');
                navigate('/production/worksheets');
            } finally {
                setLoading(false);
            }
        };
        loadWorksheet();
    }, [id, isEditMode, factories]);

    // Auto-calculate SEKAM side product
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            side_products: prev.side_products.map(sp => {
                if (sp.product_code === 'SEKAM' && sp.is_auto) {
                    return { ...sp, quantity: totalInputWeight * 0.15 };
                }
                return sp;
            })
        }));
    }, [totalInputWeight]);

    // --- Helpers ---

    const initializeSideProducts = (factoryId: number) => {
        const factory = factories.find(f => f.id === factoryId);
        const isPmd1 = factory?.code === 'PMD-1';
        const config = isPmd1 ? sideProductConfig.PMD1 : sideProductConfig.PMD2;

        const products: SideProduct[] = config.map(sp => ({
            product_code: sp.code,
            product_name: sp.name,
            quantity: 0,
            is_auto: sp.isAuto || false,
            unit_price: 0
        }));

        setFormData(prev => ({ ...prev, side_products: products }));
    };

    const generateBatchCode = () => {
        const date = new Date();
        const factory = factories.find(f => f.id === selectedFactory);
        const prefix = factory?.code === 'PMD-1' ? 'P1' : 'P2';
        return `${prefix}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
    };

    const handleProcessToggle = (code: string) => {
        setFormData(prev => {
            const current = prev.selected_processes;
            if (current.includes(code)) {
                return { ...prev, selected_processes: current.filter(c => c !== code) };
            } else {
                return { ...prev, selected_processes: [...current, code] };
            }
        });
    };

    const handleMachineToggle = (id: number) => {
        setFormData(prev => {
            const current = prev.selected_machines;
            if (current.includes(id)) {
                return { ...prev, selected_machines: current.filter(c => c !== id) };
            } else {
                return { ...prev, selected_machines: [...current, id] };
            }
        });
    };

    const handleOperatorToggle = (id: number) => {
        setFormData(prev => {
            const current = prev.selected_operators;
            if (current.includes(id)) {
                return { ...prev, selected_operators: current.filter(c => c !== id) };
            } else {
                return { ...prev, selected_operators: [...current, id] };
            }
        });
    };

    const addInputBatch = (stock: Stock, quantity: number, unitPrice: number, batchLabel?: string) => {
        const batch: InputBatch = {
            id_stock: stock.id,
            stock_name: batchLabel || stock.ProductType?.name || 'Unknown',
            quantity,
            unit_price: unitPrice,
        };
        setFormData(prev => ({
            ...prev,
            input_batches: [...prev.input_batches, batch]
        }));
        setShowBatchModal(false);
    };

    const removeInputBatch = (index: number) => {
        setFormData(prev => ({
            ...prev,
            input_batches: prev.input_batches.filter((_, i) => i !== index)
        }));
    };

    const updateSideProduct = (index: number, field: keyof SideProduct, value: number) => {
        setFormData(prev => {
            const updated = [...prev.side_products];
            (updated[index] as any)[field] = value;
            return { ...prev, side_products: updated };
        });
    };

    const handleAddOperator = async () => {
        try {
            await employeeApi.create({
                ...newOperator,
                id_factory: selectedFactory,
                gender: 'MALE',
                birth_date: '1990-01-01',
                address: '-',
                join_date: new Date().toISOString().split('T')[0],
                employment_status: 'PERMANENT',
                salary: 3000000
            });
            const empRes = await employeeApi.getAll();
            setEmployees(empRes.data?.data || []);
            setShowAddOperatorModal(false);
            setNewOperator({ fullname: '', position: 'Operator', phone: '' });
            showSuccess('Berhasil', 'Operator berhasil ditambahkan!');
        } catch (error) {
            logger.error('Error adding operator:', error);
            showError('Gagal', 'Gagal menambah operator');
        }
    };

    // --- Submit ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const inputBatchesPayload = formData.input_batches.map(b => ({
                id_stock: b.id_stock,
                quantity: b.quantity,
                unit_price: b.unit_price,
                total_cost: b.quantity * b.unit_price
            }));

            const sideProductsPayload = formData.side_products.map(sp => ({
                product_code: sp.product_code,
                product_name: sp.product_name,
                quantity: sp.quantity,
                unit_price: sp.unit_price,
                total_value: sp.quantity * sp.unit_price,
                is_auto_calculated: sp.is_auto,
                auto_percentage: sp.is_auto ? 15 : 0
            }));

            const payload = {
                id_factory: selectedFactory,
                worksheet_date: formData.worksheet_date,
                shift: formData.shift,
                id_machine: formData.selected_machines.length > 0 ? formData.selected_machines[0] : null,
                id_machines: formData.selected_machines,
                id_output_product: parseInt(formData.id_output_product) || null,
                process_steps: JSON.stringify(formData.selected_processes),
                batch_code: formData.batch_code || generateBatchCode(),
                input_batches: inputBatchesPayload,
                side_products: sideProductsPayload,
                gabah_input: totalInputWeight,
                beras_output: berasOutput,
                menir_output: 0,
                dedak_output: formData.side_products.find(sp => sp.product_code === 'BEKATUL')?.quantity || 0,
                sekam_output: formData.side_products.find(sp => sp.product_code === 'SEKAM')?.quantity || 0,
                machine_hours: 8,
                downtime_hours: 0,
                production_cost: hppCalc.productionCost,
                raw_material_cost: hppCalc.rawMaterialCost,
                side_product_revenue: hppCalc.sideProductRevenue,
                hpp: hppCalc.hpp,
                hpp_per_kg: berasOutput > 0 ? hppCalc.hpp / berasOutput : 0,
                id_operators: formData.selected_operators,
                notes: formData.selected_operators.length > 0 ? `Operators: ${formData.selected_operators.join(', ')}` : ''
            };

            if (isEditMode) {
                await worksheetApi.update(Number(id), payload);
                showSuccess('Berhasil', 'Worksheet berhasil diperbarui!');
            } else {
                await worksheetApi.create(payload);
                showSuccess('Berhasil', 'Worksheet berhasil disimpan!');
            }

            navigate('/production/worksheets');
        } catch (error) {
            logger.error('Error saving worksheet:', error);
            showError('Gagal', 'Gagal menyimpan worksheet');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Render ---

    if (loading) {
        return (
            <>
                <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }}>
                        progress_activity
                    </span>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-content">
                {/* Breadcrumb */}
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/production/worksheets')}>
                        <span className="material-symbols-outlined icon-sm">arrow_back</span>
                    </button>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
                        WORKSHEET / <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{isEditMode ? `EDIT #${id}` : 'NEW ENTRY'}</span>
                    </span>
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>
                    {isEditMode ? 'Edit Worksheet' : 'Production Worksheet Entry'}
                </h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.875rem' }}>
                    {isEditMode ? 'Update data produksi worksheet ini.' : `Record production data for ${selectedFactoryData?.name}. All fields marked * are required.`}
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Section 1: Production Details */}
                    <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.05) 100%)',
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 20 }}>assignment</span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Production Details</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Basic information & personnel</span>
                                </div>
                            </div>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Required</span>
                        </div>

                        <div style={{ padding: 24 }}>
                            {/* Factory selector (only in create mode) */}
                            {!isEditMode && factories.length > 1 && (
                                <div className="form-group" style={{ marginBottom: 20 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>factory</span>
                                        Factory *
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {factories.map(factory => (
                                            <button
                                                key={factory.id}
                                                type="button"
                                                className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => setSelectedFactory(factory.id)}
                                            >
                                                {factory.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                                {/* Production Date */}
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>calendar_month</span>
                                        Production Date *
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.worksheet_date}
                                        onChange={e => setFormData({ ...formData, worksheet_date: e.target.value })}
                                        required
                                        style={{ background: 'var(--bg-elevated)', border: '2px solid transparent' }}
                                    />
                                </div>

                                {/* Work Shift */}
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--warning)' }}>schedule</span>
                                        Work Shift *
                                    </label>
                                    <select
                                        className="form-select"
                                        value={formData.shift}
                                        onChange={e => setFormData({ ...formData, shift: e.target.value })}
                                        required
                                        style={{ background: 'var(--bg-elevated)', border: '2px solid transparent' }}
                                    >
                                        <option value="">Choose shift...</option>
                                        {Object.entries(shiftConfig).map(([key, val]) => (
                                            <option key={key} value={key}>{val.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--success)' }}>precision_manufacturing</span>
                                        Machine Units (multiple selection)
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {machines.length === 0 ? (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No machines available for this factory</div>
                                        ) : (
                                            machines.filter(m => !selectedFactory || m.id_factory === selectedFactory || true).map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => handleMachineToggle(m.id)}
                                                    className={`btn ${formData.selected_machines.includes(m.id) ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                                                >
                                                    {formData.selected_machines.includes(m.id) && (
                                                        <span className="material-symbols-outlined icon-sm">check</span>
                                                    )}
                                                    {m.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 1', margin: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)' }}>person</span>
                                        Operators (multiple selection)
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                        {employees.map(emp => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => handleOperatorToggle(emp.id)}
                                                className={`btn ${formData.selected_operators.includes(emp.id) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                                            >
                                                {formData.selected_operators.includes(emp.id) && (
                                                    <span className="material-symbols-outlined icon-sm">check</span>
                                                )}
                                                {emp.fullname}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => setShowAddOperatorModal(true)}
                                            style={{
                                                padding: '0 8px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px dashed var(--primary)',
                                                borderRadius: 6
                                            }}
                                            title="Add new operator"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>person_add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                        {/* Left Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* Section 2: Output Product & Process */}
                            <div className="card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: '50%' }}>tune</span>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>2. Output Product & Process</h3>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Output Product *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                                        {outputProducts.map(op => (
                                            <button
                                                key={op.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, id_output_product: String(op.id) })}
                                                style={{
                                                    padding: '12px 16px',
                                                    border: `2px solid ${formData.id_output_product === String(op.id) ? 'var(--primary)' : 'var(--border-color)'}`,
                                                    borderRadius: 8,
                                                    background: formData.id_output_product === String(op.id) ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-surface)',
                                                    cursor: 'pointer',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, color: formData.id_output_product === String(op.id) ? 'var(--primary)' : 'var(--text-primary)', fontSize: '0.875rem' }}>{op.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: 20 }}>
                                    <label className="form-label">Process Steps (multiple selection)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {processCategories.map(pc => (
                                            <button
                                                key={pc.id}
                                                type="button"
                                                onClick={() => handleProcessToggle(pc.code)}
                                                className={`btn ${formData.selected_processes.includes(pc.code) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                {formData.selected_processes.includes(pc.code) && (
                                                    <span className="material-symbols-outlined icon-sm">check</span>
                                                )}
                                                {pc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Production Data */}
                            <div className="card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: '50%' }}>inventory_2</span>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Production Data</h3>
                                </div>

                                {/* Batch Code */}
                                <div className="form-group">
                                    <label className="form-label">Batch Code</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={generateBatchCode()}
                                            value={formData.batch_code}
                                            onChange={e => setFormData({ ...formData, batch_code: e.target.value })}
                                        />
                                        <button type="button" className="btn btn-secondary" onClick={() => setFormData({ ...formData, batch_code: generateBatchCode() })}>
                                            <span className="material-symbols-outlined icon-sm">autorenew</span>
                                            Generate
                                        </button>
                                    </div>
                                </div>

                                {/* Input Batches */}
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <label className="form-label" style={{ margin: 0 }}>Input Batches (Raw Material) *</label>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowBatchModal(true)}>
                                            <span className="material-symbols-outlined icon-sm">add</span>
                                            Add Batch
                                        </button>
                                    </div>

                                    {formData.input_batches.length === 0 ? (
                                        <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 32, marginBottom: 8 }}>inventory</span>
                                            <p>No input batches added. Click "Add Batch" to select raw material.</p>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                            <table className="table" style={{ margin: 0 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Batch / Material</th>
                                                        <th style={{ textAlign: 'right' }}>Qty Pakai</th>
                                                        <th style={{ textAlign: 'right' }}>Harga/kg</th>
                                                        <th style={{ textAlign: 'right' }}>Total Biaya</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.input_batches.map((batch, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <div style={{ fontWeight: 500 }}>{batch.stock_name}</div>
                                                            </td>
                                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(batch.quantity)} kg</td>
                                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(batch.unit_price)}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(batch.quantity * batch.unit_price)}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeInputBatch(idx)}>
                                                                    <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr style={{ background: 'var(--bg-elevated)' }}>
                                                        <td style={{ fontWeight: 600 }}>Total Input</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatNumber(totalInputWeight)} kg</td>
                                                        <td></td>
                                                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{formatCurrency(hppCalc.rawMaterialCost)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Output */}
                                <div className="form-group" style={{ marginTop: 16 }}>
                                    <label className="form-label">Output Weight (Main Product) *</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            value={formData.beras_output}
                                            onChange={e => setFormData({ ...formData, beras_output: e.target.value })}
                                            step="0.01"
                                            required
                                            style={{ textAlign: 'right' }}
                                        />
                                        <span className="input-addon">kg</span>
                                    </div>
                                </div>

                                {/* Side Products */}
                                <div className="form-group" style={{ marginTop: 20 }}>
                                    <label className="form-label">Side Products / Waste</label>
                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                        <table className="table" style={{ margin: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th style={{ textAlign: 'right' }}>Quantity (kg)</th>
                                                    <th style={{ textAlign: 'right' }}>Price/kg</th>
                                                    <th style={{ textAlign: 'right' }}>Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.side_products.map((sp, idx) => (
                                                    <tr key={sp.product_code}>
                                                        <td>
                                                            {sp.product_name}
                                                            {sp.is_auto && <span className="badge badge-info" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Auto 15%</span>}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                value={sp.quantity || ''}
                                                                onChange={e => updateSideProduct(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                                style={{ width: 100, textAlign: 'right' }}
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                value={sp.unit_price || ''}
                                                                onChange={e => updateSideProduct(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                style={{ width: 120, textAlign: 'right' }}
                                                                placeholder="Rp"
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                                            {formatCurrency(sp.quantity * sp.unit_price)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr style={{ background: 'var(--bg-elevated)' }}>
                                                    <td colSpan={3} style={{ fontWeight: 600 }}>Total Side Product Revenue</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(hppCalc.sideProductRevenue)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Section 4: Cost & HPP */}
                            <div className="card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: '50%' }}>calculate</span>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>4. Cost & HPP</h3>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Production Cost (Rp)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={formData.production_cost}
                                        onChange={e => setFormData({ ...formData, production_cost: e.target.value })}
                                        style={{ textAlign: 'right' }}
                                    />
                                </div>

                                <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Production Cost</span>
                                        <span>{formatCurrency(hppCalc.productionCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>+ Raw Material Cost</span>
                                        <span>{formatCurrency(hppCalc.rawMaterialCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>- Side Product Revenue</span>
                                        <span style={{ color: 'var(--success)' }}>({formatCurrency(hppCalc.sideProductRevenue)})</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
                                            <span>HPP Total</span>
                                            <span style={{ color: 'var(--primary)' }}>{formatCurrency(hppCalc.hpp)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>HPP per kg</span>
                                            <span style={{ fontWeight: 500 }}>{berasOutput > 0 ? formatCurrency(hppCalc.hpp / berasOutput) : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Yield Stats */}
                            <div style={{
                                padding: 24,
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: 12,
                                border: '1px solid #bae6fd'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    RENDEMEN (YIELD)
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0284c7', marginTop: 8 }}>
                                    {yieldPercentage}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                                    {formatNumber(berasOutput)} kg dari {formatNumber(totalInputWeight)} kg
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/production/worksheets')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            <span className="material-symbols-outlined icon-sm">{submitting ? 'progress_activity' : 'save'}</span>
                            {submitting ? 'Saving...' : (isEditMode ? 'Update Worksheet' : 'Save Worksheet')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Batch Selection Modal */}
            {showBatchModal && (
                <BatchSelectionModal
                    stocks={stocks}
                    selectedFactory={selectedFactory}
                    onSelect={addInputBatch}
                    onClose={() => setShowBatchModal(false)}
                />
            )}

            {/* Add Operator Modal */}
            {showAddOperatorModal && (
                <div className="modal-overlay" onClick={() => setShowAddOperatorModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Operator</h3>
                            <button className="modal-close" onClick={() => setShowAddOperatorModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newOperator.fullname}
                                    onChange={e => setNewOperator({ ...newOperator, fullname: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Position</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newOperator.position}
                                    onChange={e => setNewOperator({ ...newOperator, position: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newOperator.phone}
                                    onChange={e => setNewOperator({ ...newOperator, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddOperatorModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddOperator}>Save Operator</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Batch Selection Modal ---

interface ReceiptBatch {
    id: number;              // StockMovement ID
    id_stock: number;        // Stock ID (untuk link ke WorksheetInputBatch)
    batchId: string;         // e.g. "BTC-2026-001"
    supplier: string;        // e.g. "UD Padi Jaya"
    category: string;        // e.g. "Padi/Gabah"
    productName: string;     // e.g. "Gabah Kering Panen"
    productCode: string;     // e.g. "GKP"
    qualityGrade: string;    // e.g. "KW 1"
    quantity: number;         // qty diterima (dari movement)
    pricePerKg: number;      // harga per kg
    otherCosts: number;      // biaya lain (bongkar dll)
    dateReceived: string;    // tanggal penerimaan
    stockQuantity: number;   // current stock available (aggregate)
}

const BatchSelectionModal = ({ stocks, selectedFactory, onSelect, onClose }: {
    stocks: Stock[];
    selectedFactory: number | null;
    onSelect: (stock: Stock, quantity: number, unitPrice: number, batchLabel: string) => void;
    onClose: () => void;
}) => {
    const [receiptBatches, setReceiptBatches] = useState<ReceiptBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<ReceiptBatch | null>(null);
    const [quantity, setQuantity] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch receipt batches on mount
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                // Get all stock movements for this factory with reference_type = RAW_MATERIAL_RECEIPT
                const params: any = {
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    movement_type: 'IN',
                    limit: 200
                };
                const res = await api.get('/stock-movements', { params });
                const movements = res.data?.data || [];

                // Parse notes JSON and build batch list
                const batches: ReceiptBatch[] = movements
                    .filter((m: any) => {
                        // Filter by factory via Stock relation
                        const stock = m.Stock;
                        return stock && (!selectedFactory || stock.id_factory === selectedFactory);
                    })
                    .map((m: any) => {
                        let noteData: any = {};
                        try {
                            noteData = JSON.parse(m.notes || '{}');
                        } catch { noteData = {}; }

                        const stock = m.Stock;
                        return {
                            id: m.id,
                            id_stock: m.id_stock,
                            batchId: noteData.batchId || `MOV-${m.id}`,
                            supplier: noteData.supplier || '-',
                            category: noteData.category || '-',
                            productName: stock?.ProductType?.name || noteData.category || 'Unknown',
                            productCode: stock?.ProductType?.code || '-',
                            qualityGrade: noteData.qualityGrade || '-',
                            quantity: Number(m.quantity),
                            pricePerKg: Number(noteData.pricePerKg) || 0,
                            otherCosts: Number(noteData.otherCosts) || 0,
                            dateReceived: m.created_at,
                            stockQuantity: Number(stock?.quantity) || 0
                        };
                    });

                setReceiptBatches(batches);
            } catch (error) {
                logger.error('Error fetching receipt batches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [selectedFactory]);

    // Filter batches by search
    const filteredBatches = searchTerm
        ? receiptBatches.filter(b =>
            b.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : receiptBatches;

    const handleSelectBatch = (batch: ReceiptBatch) => {
        setSelectedBatch(batch);
        setQuantity(''); // Reset qty
    };

    const handleConfirm = () => {
        if (!selectedBatch || !quantity) return;

        // Find the Stock object for this batch
        const stock = stocks.find(s => s.id === selectedBatch.id_stock);
        if (!stock) return;

        const qty = parseFloat(quantity);
        const batchLabel = `${selectedBatch.batchId} - ${selectedBatch.productName}`;

        // Kalkulasi Harga Landed (HPP Material) = Harga Beli + (Biaya Lain / Total Qty Received)
        const basePrice = selectedBatch.pricePerKg || 0;
        const totalOtherCosts = selectedBatch.otherCosts || 0;
        const totalReceivedQty = selectedBatch.quantity || 1;
        const overheadPerKg = totalOtherCosts / totalReceivedQty;
        const landedPricePerKg = basePrice + overheadPerKg;

        onSelect(stock, qty, landedPricePerKg, batchLabel);
    };

    // Max available = aggregate stock quantity for this product
    const maxAvailable = selectedBatch
        ? stocks.find(s => s.id === selectedBatch.id_stock)?.quantity || 0
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
                <div className="modal-header">
                    <h3 className="modal-title">Pilih Batch Bahan Baku</h3>
                    <button className="modal-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="modal-body">
                    {/* Search */}
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', fontSize: 18
                            }}>search</span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Cari batch ID, supplier, atau material..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    {/* Batch List */}
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                        {loading ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined animate-spin" style={{ display: 'inline-block' }}>sync</span>
                                <p>Memuat data batch...</p>
                            </div>
                        ) : filteredBatches.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inventory</span>
                                <p>Tidak ada batch penerimaan ditemukan</p>
                            </div>
                        ) : (
                            <table className="table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>Batch ID</th>
                                        <th>Material</th>
                                        <th>Supplier</th>
                                        <th>Grade</th>
                                        <th style={{ textAlign: 'right' }}>Qty Terima</th>
                                        <th style={{ textAlign: 'right' }}>Harga/kg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map(batch => (
                                        <tr
                                            key={batch.id}
                                            onClick={() => handleSelectBatch(batch)}
                                            style={{
                                                cursor: 'pointer',
                                                background: selectedBatch?.id === batch.id
                                                    ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: selectedBatch?.id === batch.id
                                                    ? '3px solid var(--primary)' : '3px solid transparent'
                                            }}
                                        >
                                            <td>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{batch.batchId}</span>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {new Date(batch.dateReceived).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{batch.productCode}</span>
                                                {' '}{batch.productName}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{batch.supplier}</td>
                                            <td>
                                                <span className="badge badge-muted">{batch.qualityGrade}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                {formatNumber(batch.quantity)} kg
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                                {batch.pricePerKg > 0 ? formatCurrency(batch.pricePerKg) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Selected Batch Detail + Qty Input */}
                    {selectedBatch && (
                        <div style={{
                            marginTop: 16, padding: 16, borderRadius: 8,
                            border: '2px solid var(--primary)',
                            background: 'rgba(59, 130, 246, 0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <strong>{selectedBatch.batchId}</strong> — {selectedBatch.productName}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Supplier: {selectedBatch.supplier} | Grade: {selectedBatch.qualityGrade}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        {formatCurrency(selectedBatch.pricePerKg + (selectedBatch.otherCosts / (selectedBatch.quantity || 1)))}/kg
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Base: {formatCurrency(selectedBatch.pricePerKg)} | Biaya: {formatCurrency(selectedBatch.otherCosts / (selectedBatch.quantity || 1))}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        Stok tersedia: {formatNumber(maxAvailable)} kg
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Jumlah yang dipakai (kg) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    max={maxAvailable}
                                    placeholder={`Max: ${formatNumber(maxAvailable)} kg`}
                                    step="0.01"
                                    style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                    autoFocus
                                />
                                {quantity && parseFloat(quantity) > 0 && (
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                        Total biaya: <strong style={{ color: 'var(--primary)' }}>
                                            {formatCurrency(parseFloat(quantity) * selectedBatch.pricePerKg)}
                                        </strong>
                                    </small>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selectedBatch || !quantity || parseFloat(quantity) <= 0}
                    >
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Tambah Batch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorksheetForm;
