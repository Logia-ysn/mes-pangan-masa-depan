import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

import api, { worksheetApi, stockApi, factoryApi, machineApi, employeeApi, processCategoryApi, factoryMaterialApi } from '../../services/api';
import { logger } from '../../utils/logger';
import SKUSelector from '../../components/Production/SKUSelector';
import type { Factory, Machine, Employee, Stock, ProcessCategory, InputBatch, SideProduct } from '../../features/production/worksheet/types/worksheet.types';
import { shiftConfig } from '../../features/production/worksheet/config/worksheet.config';
import { useHPPCalculation } from '../../features/production/worksheet/hooks/useHPPCalculation';
import { useInputBatches } from '../../features/production/worksheet/hooks/useInputBatches';
import { useSideProducts } from '../../features/production/worksheet/hooks/useSideProducts';
import InputBatchSection from '../../features/production/worksheet/components/InputBatchSection';
import SideProductSection from '../../features/production/worksheet/components/SideProductSection';
import HPPSummary from '../../features/production/worksheet/components/HPPSummary';
import BatchSelectionModal from '../../features/production/worksheet/components/BatchSelectionModal';

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

    // UI state
    const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showAddOperatorModal, setShowAddOperatorModal] = useState(false);
    const [generatingBatch, setGeneratingBatch] = useState(false);

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

    // --- Hooks ---

    const { totalInputWeight, addBatch, removeBatch } = useInputBatches(
        formData.input_batches,
        setFormData
    );

    const { updateSideProduct } = useSideProducts(
        formData.side_products,
        totalInputWeight,
        setFormData
    );

    const berasOutput = useMemo(() =>
        parseFloat(formData.beras_output) || 0,
        [formData.beras_output]
    );

    const hppCalc = useHPPCalculation({
        inputBatches: formData.input_batches,
        sideProducts: formData.side_products,
        productionCost: formData.production_cost,
        berasOutput: formData.beras_output,
    });

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
                setFactories(allFactories);
                setMachines(machRes.data?.data || []);
                setEmployees(empRes.data?.data || []);
                setProcessCategories(procRes.data?.data || []);

                // Set default factory
                if (!isEditMode && allFactories.length > 0) {
                    setSelectedFactory(allFactories[0].id);
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
                const [stockRes] = await Promise.all([
                    stockApi.getAll({ id_factory: selectedFactory }),
                ]);
                setStocks(stockRes.data?.data || []);
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

    // Auto-calculate SEKAM side product — now handled by useSideProducts hook

    // --- Helpers ---

    const initializeSideProducts = async (factoryId: number) => {
        try {
            // Fetch factory material config to find outputs with category SIDE_PRODUCT
            const res = await factoryMaterialApi.getAll(factoryId);
            const materials = res.data?.data || [];

            // Filter only outputs that are classified as SIDE_PRODUCT
            const sideProductMaterials = materials.filter((m: any) =>
                m.is_output && m.ProductType?.category === 'SIDE_PRODUCT'
            );

            const products: SideProduct[] = sideProductMaterials.map((m: any) => ({
                id_product_type: m.id_product_type,
                product_code: m.ProductType?.code || 'UNKNOWN',
                product_name: m.ProductType?.name || 'Unknown',
                quantity: 0,
                is_auto: m.ProductType?.code === 'SEKAM', // Default auto for SEKAM
                unit_price: 0
            }));

            setFormData(prev => ({ ...prev, side_products: products }));
        } catch (error) {
            logger.error('Error initializing side products:', error);
        }
    };

    // Batch code readiness check: needs factory + output product selected
    const isFormReadyForBatch = !!(selectedFactory && formData.id_output_product);

    const handleGenerateBatchCode = async () => {
        if (!isFormReadyForBatch) {
            showError('Perhatian', 'Pilih Pabrik dan Output Product (SKU) terlebih dahulu');
            return;
        }

        setGeneratingBatch(true);
        try {
            const factory = factories.find(f => f.id === selectedFactory);
            if (!factory) {
                showError('Error', 'Pabrik tidak ditemukan');
                return;
            }

            const response = await api.post('/batch-code/generate', {
                factoryCode: factory.code,
                productTypeId: parseInt(formData.id_output_product),
                date: formData.worksheet_date
            });

            const batchCode = response.data?.batchCode;
            if (batchCode) {
                setFormData(prev => ({ ...prev, batch_code: batchCode }));
                showSuccess('Berhasil', `Batch Code berhasil digenerate: ${batchCode}`);
            } else {
                showError('Error', 'Gagal mendapatkan batch code dari server');
            }
        } catch (error: any) {
            logger.error('Failed to generate batch code:', error);
            showError('Gagal', error.response?.data?.error || error.message || 'Gagal generate Batch Code');
        } finally {
            setGeneratingBatch(false);
        }
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

    // addBatch, removeBatch — from useInputBatches hook
    // updateSideProduct — from useSideProducts hook

    const handleBatchSelect = (stock: Stock, quantity: number, unitPrice: number, batchLabel: string, rawBatchId?: string) => {
        addBatch(stock, quantity, unitPrice, batchLabel, rawBatchId);
        setShowBatchModal(false);
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
                total_cost: b.quantity * b.unit_price,
                batch_code: b.batch_code
            }));

            const sideProductsPayload = formData.side_products.map(sp => ({
                id_product_type: sp.id_product_type,
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
                batch_code: formData.batch_code,
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
                                            machines.map(m => (
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
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 18 }}>shopping_bag</span>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>2. Output Product & Process</h3>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU selection and processing steps</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '24px'
                                    }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>inventory</span>
                                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Output Product (SKU) *</label>
                                            </div>
                                            <SKUSelector
                                                value={formData.id_output_product}
                                                idFactory={selectedFactory}
                                                onChange={(id, _code, _name) => setFormData({ ...formData, id_output_product: String(id) })}
                                                category="FINISHED_RICE"
                                                placeholder="Pilih SKU Beras..."
                                            />
                                        </div>

                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--success)' }}>settings_suggest</span>
                                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Process Steps (multiple selection)</label>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 10,
                                                padding: '4px'
                                            }}>
                                                {processCategories.map(pc => {
                                                    const isActive = formData.selected_processes.includes(pc.code);
                                                    return (
                                                        <button
                                                            key={pc.id}
                                                            type="button"
                                                            onClick={() => handleProcessToggle(pc.code)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                padding: '10px 18px',
                                                                borderRadius: '50px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 500,
                                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                border: '1.5px solid',
                                                                borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                                                                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                                                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                                                boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none',
                                                                transform: isActive ? 'translateY(-1px)' : 'none'
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{
                                                                fontSize: 18,
                                                                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                                                            }}>
                                                                {isActive ? 'check_circle' : 'radio_button_unchecked'}
                                                            </span>
                                                            {pc.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Production Data */}
                            <div className="card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: '50%' }}>inventory_2</span>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Production Data</h3>
                                </div>

                                {/* Batch Code — auto-generate via backend API */}
                                <div style={{
                                    padding: '16px 20px',
                                    borderRadius: 12,
                                    border: formData.batch_code
                                        ? '2px solid var(--success)'
                                        : isFormReadyForBatch
                                            ? '2px dashed var(--primary)'
                                            : '2px dashed var(--border-color)',
                                    background: formData.batch_code
                                        ? 'rgba(34, 197, 94, 0.04)'
                                        : isFormReadyForBatch
                                            ? 'rgba(59, 130, 246, 0.04)'
                                            : 'var(--bg-elevated)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span className="material-symbols-outlined" style={{
                                                    fontSize: 20,
                                                    color: formData.batch_code ? 'var(--success)' : 'var(--text-secondary)'
                                                }}>
                                                    {formData.batch_code ? 'check_circle' : 'qr_code_2'}
                                                </span>
                                                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Batch Code</label>
                                            </div>
                                            {formData.batch_code ? (
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '1.1rem',
                                                    fontWeight: 700,
                                                    color: 'var(--success)',
                                                    letterSpacing: 1
                                                }}>
                                                    {formData.batch_code}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    {isFormReadyForBatch
                                                        ? 'Klik tombol untuk generate Batch Code otomatis.'
                                                        : 'Pilih Pabrik dan Output Product (SKU) terlebih dahulu.'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {formData.batch_code ? (
                                                <>
                                                    <button type="button" className="btn btn-secondary btn-sm"
                                                        onClick={() => setFormData(prev => ({ ...prev, batch_code: '' }))}
                                                    >
                                                        <span className="material-symbols-outlined icon-sm">refresh</span>
                                                        Reset
                                                    </button>
                                                    <button type="button" className="btn btn-primary btn-sm"
                                                        onClick={handleGenerateBatchCode}
                                                        disabled={generatingBatch}
                                                    >
                                                        <span className="material-symbols-outlined icon-sm">
                                                            {generatingBatch ? 'progress_activity' : 'auto_awesome'}
                                                        </span>
                                                        Re-generate
                                                    </button>
                                                </>
                                            ) : (
                                                <button type="button" className="btn btn-primary"
                                                    onClick={handleGenerateBatchCode}
                                                    disabled={!isFormReadyForBatch || generatingBatch}
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    <span className="material-symbols-outlined icon-sm">
                                                        {generatingBatch ? 'progress_activity' : 'auto_awesome'}
                                                    </span>
                                                    {generatingBatch ? 'Generating...' : 'Generate Batch Code'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Input Batches */}
                                <InputBatchSection
                                    batches={formData.input_batches}
                                    totalInputWeight={totalInputWeight}
                                    rawMaterialCost={hppCalc.rawMaterialCost}
                                    onAdd={() => setShowBatchModal(true)}
                                    onRemove={removeBatch}
                                />

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
                                <SideProductSection
                                    sideProducts={formData.side_products}
                                    sideProductRevenue={hppCalc.sideProductRevenue}
                                    onUpdate={updateSideProduct}
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <HPPSummary
                            hppCalc={hppCalc}
                            berasOutput={berasOutput}
                            totalInputWeight={totalInputWeight}
                            yieldPercentage={yieldPercentage}
                            productionCostValue={formData.production_cost}
                            onProductionCostChange={(value) => setFormData({ ...formData, production_cost: value })}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/production/worksheets')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || !formData.batch_code}>
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
                    onSelect={handleBatchSelect}
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

export default WorksheetForm;
