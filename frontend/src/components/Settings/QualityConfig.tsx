import { useState, useEffect } from 'react';
import { qualityParameterApi, rawMaterialVarietyApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface QualityParameter {
    id: number;
    name: string;
    grade: string;
    min_value: number;
    max_value: number;
    unit: string;
    id_variety?: number;
    level?: number;
}

interface Variety {
    id: number;
    name: string;
}

interface EditingValues {
    level: number;
    min_value: number;
    max_value: number;
}

const gradeColors: Record<string, { bg: string, border: string, text: string }> = {
    'KW 1': { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
    'KW 2': { bg: '#fef9c3', border: '#eab308', text: '#a16207' },
    'KW 3': { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
};

const QualityConfig = () => {
    const [activeSubTab, setActiveSubTab] = useState<'moisture' | 'density' | 'color'>('moisture');
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState<QualityParameter[]>([]);
    const [varieties, setVarieties] = useState<Variety[]>([]);
    const [selectedVariety, setSelectedVariety] = useState<string>('');

    // States for Parameter Settings Table
    const [allParams, setAllParams] = useState<QualityParameter[]>([]);
    const [allParamsLoading, setAllParamsLoading] = useState(false);
    const [editingParamId, setEditingParamId] = useState<number | null>(null);
    const [editingValues, setEditingValues] = useState<EditingValues>({ level: 1, min_value: 0, max_value: 0 });

    // Creating state
    const [isCreating, setIsCreating] = useState(false);
    const [newParam, setNewParam] = useState({ grade: 'KW 1', level: 1, min_value: 0, max_value: 0 });

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null; name: string }>({ show: false, id: null, name: '' });
    const [deleting, setDeleting] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        fetchVarieties();
        fetchAllParams(); // Fetch all params on mount
    }, []);

    useEffect(() => {
        fetchParams();
    }, [activeSubTab, selectedVariety]);

    const fetchVarieties = async () => {
        try {
            const res = await rawMaterialVarietyApi.getAll();
            setVarieties(res.data?.data || []);
        } catch (e) { logger.error(e); }
    };

    // Fetch ALL parameters for the table (no filter)
    const fetchAllParams = async () => {
        setAllParamsLoading(true);
        try {
            const res = await qualityParameterApi.getAll({});
            setAllParams(res.data?.data || []);
        } catch (e) { logger.error(e); }
        finally { setAllParamsLoading(false); }
    };

    const fetchParams = async () => {
        setLoading(true);
        try {
            let filter: any = {};
            if (selectedVariety) {
                filter.id_variety = parseInt(selectedVariety);
            }

            const res = await qualityParameterApi.getAll(filter);
            let data = res.data?.data || [];

            // Client side filter by name
            if (activeSubTab === 'moisture') {
                data = data.filter((p: any) => p.name === 'Moisture');
            } else if (activeSubTab === 'density') {
                data = data.filter((p: any) => p.name === 'Density');
            } else if (activeSubTab === 'color') {
                data = data.filter((p: any) => p.name === 'Color');
            }

            setParams(data);
        } catch (e) { logger.error(e); }
        finally { setLoading(false); }
    };

    // Table editing functions
    const handleTableEdit = (param: QualityParameter) => {
        setEditingParamId(param.id);
        setEditingValues({
            level: param.level || 1,
            min_value: param.min_value,
            max_value: param.max_value
        });
    };

    const handleTableSave = async (id: number) => {
        try {
            await qualityParameterApi.update(id, editingValues);
            setEditingParamId(null);
            fetchAllParams(); // Refresh the table
            fetchParams(); // Also refresh the cards if same data
            showToast('Parameter berhasil disimpan!', 'success');
        } catch (e) {
            logger.error(e);
            showToast('Gagal menyimpan parameter', 'error');
        }
    };

    const handleCreateSave = async () => {
        try {
            const name = activeSubTab === 'moisture' ? 'Moisture' : activeSubTab === 'density' ? 'Density' : 'Color';
            const unit = activeSubTab === 'moisture' ? '%' : activeSubTab === 'density' ? 'g/L' : 'index';

            await qualityParameterApi.create({
                name,
                unit,
                grade: newParam.grade,
                level: newParam.level,
                min_value: newParam.min_value,
                max_value: newParam.max_value,
                id_variety: selectedVariety ? parseInt(selectedVariety) : undefined
            });

            setIsCreating(false);
            setNewParam({ grade: 'KW 1', level: 1, min_value: 0, max_value: 0 }); // Reset form
            fetchAllParams();
            fetchParams();
            showToast('Parameter berhasil dibuat!', 'success');
        } catch (e) {
            logger.error(e);
            showToast('Gagal membuat parameter', 'error');
        }
    };

    // Show delete confirmation modal
    const showDeleteConfirm = (param: QualityParameter) => {
        setDeleteConfirm({ show: true, id: param.id, name: `${param.name} - ${param.grade}` });
    };

    // Execute delete
    const handleTableDelete = async () => {
        if (!deleteConfirm.id) return;
        setDeleting(true);
        try {
            await qualityParameterApi.delete(deleteConfirm.id);
            fetchAllParams();
            fetchParams();
            setDeleteConfirm({ show: false, id: null, name: '' });
        } catch (e) {
            logger.error(e);
            showToast('Gagal menghapus parameter', 'error');
        } finally {
            setDeleting(false);
        }
    };







    const handleCreateForGrade = async (grade: string) => {
        setLoading(true);
        try {
            const name = activeSubTab === 'moisture' ? 'Moisture' : activeSubTab === 'density' ? 'Density' : 'Color';
            const unit = activeSubTab === 'moisture' ? '%' : activeSubTab === 'density' ? 'g/L' : 'index';

            const defaults: Record<string, { min: number, max: number }> = {
                'KW 1': { min: activeSubTab === 'moisture' ? 12 : 780, max: activeSubTab === 'moisture' ? 14 : 820 },
                'KW 2': { min: activeSubTab === 'moisture' ? 14.1 : 740, max: activeSubTab === 'moisture' ? 16 : 779 },
                'KW 3': { min: activeSubTab === 'moisture' ? 16.1 : 700, max: activeSubTab === 'moisture' ? 18 : 739 },
            };

            await qualityParameterApi.create({
                name,
                grade,
                level: 1, // Default to Level 1 when creating from card
                min_value: defaults[grade]?.min || 0,
                max_value: defaults[grade]?.max || 100,
                unit,
                id_variety: selectedVariety ? parseInt(selectedVariety) : undefined
            });
            fetchParams();
            fetchAllParams(); // Also refresh the table
            showToast(`Parameter ${name} ${grade} Level 1 berhasil dibuat!`, 'success');
        } catch (e) {
            logger.error(e);
            showToast('Gagal membuat parameter', 'error');
        }
        finally { setLoading(false); }
    };

    const handleCreateAllDefaults = async () => {
        if (!confirm('Create default parameters for KW 1, KW 2, and KW 3?')) return;
        await handleCreateForGrade('KW 1');
        await handleCreateForGrade('KW 2');
        await handleCreateForGrade('KW 3');
    };

    // Get Aggregated Range for Card Display (Min Level ... Max Level)
    const getParamForGrade = (grade: string) => {
        // Filter params for this grade
        const gradeParams = params.filter(p => p.grade === grade);

        if (gradeParams.length === 0) return null;

        // Find min of min_value and max of max_value
        const minVal = Math.min(...gradeParams.map(p => p.min_value));
        const maxVal = Math.max(...gradeParams.map(p => p.max_value));
        const unit = gradeParams[0].unit;

        return { min_value: minVal, max_value: maxVal, unit };
    };

    const renderGradeCard = (grade: string) => {
        const param = getParamForGrade(grade);
        const colors = gradeColors[grade] || { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563' };

        return (
            <div
                key={grade}
                style={{
                    flex: 1,
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: 20,
                    position: 'relative'
                }}
            >
                {/* Grade Badge */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: param ? 16 : 0
                }}>
                    <div style={{
                        background: colors.border,
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: 20,
                        fontWeight: 700,
                        fontSize: '1rem'
                    }}>
                        {grade}
                    </div>
                </div>

                {param ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, opacity: 0.8, marginBottom: 4 }}>TOTAL RANGE</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.text }}>
                            {param.min_value} - {param.max_value}
                            <span style={{ fontSize: '1rem', marginLeft: 6, opacity: 0.7 }}>{param.unit}</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', opacity: 0.5 }}>
                        <div style={{ fontSize: '0.875rem', fontStyle: 'italic', fontWeight: 500 }}>Not Configured</div>
                    </div>
                )}
            </div>
        );
    };

    const tabConfig = {
        moisture: { icon: 'water_drop', label: 'Kadar Air (Moisture)', unit: '%' },
        density: { icon: 'density_medium', label: 'Densitas (Density)', unit: 'g/L' },
        color: { icon: 'palette', label: 'Warna (Color)', unit: 'index' }
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tune</span>
                        <h3 className="card-title">Quality Parameter Configuration</h3>
                    </div>
                    {loading && <span className="material-symbols-outlined animate-spin icon-sm">sync</span>}
                </div>

                <div style={{ padding: 24 }}>
                    {/* Variety Selector - Global */}
                    <div className="form-group" style={{ maxWidth: 300, marginBottom: 24 }}>
                        <label className="form-label">
                            <span className="material-symbols-outlined icon-sm" style={{ verticalAlign: 'text-bottom', marginRight: 4 }}>eco</span>
                            Variety
                        </label>
                        <select
                            className="form-input form-select"
                            value={selectedVariety}
                            onChange={e => setSelectedVariety(e.target.value)}
                        >
                            <option value="">-- Global (All Varieties) --</option>
                            {varieties.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sub Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                        {(['moisture', 'density', 'color'] as const).map(tab => (
                            <button
                                key={tab}
                                className={`btn ${activeSubTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveSubTab(tab)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <span className="material-symbols-outlined icon-sm">{tabConfig[tab].icon}</span>
                                {tabConfig[tab].label}
                            </button>
                        ))}
                    </div>

                    {/* Info Bar */}
                    <div style={{
                        background: 'var(--bg-elevated)',
                        padding: '12px 16px',
                        borderRadius: 8,
                        marginBottom: 24,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Configure min/max value ranges for each quality grade level. Values within range will be assigned to that grade.
                        </div>
                        {params.length === 0 && (
                            <button className="btn btn-primary btn-sm" onClick={handleCreateAllDefaults} disabled={loading}>
                                <span className="material-symbols-outlined icon-sm">auto_awesome</span>
                                Create All Defaults
                            </button>
                        )}
                    </div>

                    {/* Grade Cards Grid */}
                    <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                        {renderGradeCard('KW 1')}
                        {renderGradeCard('KW 2')}
                        {renderGradeCard('KW 3')}
                    </div>

                    {/* Helper text for multi-level */}
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                        Kartu di atas menampilkan TOTAL Range (Min - Max) dari semua Level yang dikonfigurasi. Untuk detail, lihat tabel.
                    </div>

                    {/* Parameter Settings Table Section */}
                    <div className="card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>table_chart</span>
                                    <h4 style={{ margin: 0, fontWeight: 600 }}>Tabel Parameter Setting</h4>
                                </div>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={fetchAllParams}
                                    disabled={allParamsLoading}
                                >
                                    <span className={`material-symbols-outlined icon-sm ${allParamsLoading ? 'animate-spin' : ''}`}>refresh</span>
                                    Refresh
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                        setIsCreating(true);
                                        setNewParam({ grade: 'KW 1', level: 1, min_value: 0, max_value: 0 });
                                    }}
                                    disabled={isCreating}
                                >
                                    <span className="material-symbols-outlined icon-sm">add</span>
                                    Add Parameter
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 20 }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                                Daftar lengkap semua parameter kualitas yang telah dikonfigurasi. Data ini menampilkan setting KW dan Level untuk setiap tipe parameter.
                            </p>

                            {allParamsLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--primary)' }}>sync</span>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Loading parameters...</p>
                                </div>
                            ) : allParams.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-surface)', borderRadius: 8 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>inbox</span>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Belum ada parameter yang dikonfigurasi</p>
                                </div>
                            ) : (
                                <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <table className="table" style={{ width: '100%' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>
                                            <tr>
                                                <th style={{ width: '5%' }}>#</th>
                                                <th style={{ width: '15%' }}>Tipe</th>
                                                <th style={{ width: '12%' }}>Grade</th>
                                                <th style={{ width: '10%' }}>Level</th>
                                                <th style={{ width: '15%' }}>Min Value</th>
                                                <th style={{ width: '15%' }}>Max Value</th>
                                                <th style={{ width: '13%' }}>Varietas</th>
                                                <th style={{ width: '15%' }}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Create New Row */}
                                            {isCreating && (
                                                <tr style={{ background: 'rgba(var(--primary-rgb), 0.1)' }}>
                                                    <td>-</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>
                                                                {activeSubTab === 'moisture' ? 'water_drop' : activeSubTab === 'density' ? 'scale' : 'palette'}
                                                            </span>
                                                            <span style={{ fontWeight: 500 }}>
                                                                {activeSubTab === 'moisture' ? 'Moisture' : activeSubTab === 'density' ? 'Density' : 'Color'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-input"
                                                            style={{ padding: '4px 8px', height: 32 }}
                                                            value={newParam.grade}
                                                            onChange={e => setNewParam({ ...newParam, grade: e.target.value })}
                                                        >
                                                            <option value="KW 1">KW 1</option>
                                                            <option value="KW 2">KW 2</option>
                                                            <option value="KW 3">KW 3</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            style={{ padding: '4px 8px', height: 32, width: 60 }}
                                                            value={newParam.level}
                                                            onChange={e => setNewParam({ ...newParam, level: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ padding: '4px 8px', height: 32, width: 80 }}
                                                                value={newParam.min_value}
                                                                onChange={e => setNewParam({ ...newParam, min_value: parseFloat(e.target.value) || 0 })}
                                                            />
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {activeSubTab === 'moisture' ? '%' : activeSubTab === 'density' ? 'g/L' : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ padding: '4px 8px', height: 32, width: 80 }}
                                                                value={newParam.max_value}
                                                                onChange={e => setNewParam({ ...newParam, max_value: parseFloat(e.target.value) || 0 })}
                                                            />
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {activeSubTab === 'moisture' ? '%' : activeSubTab === 'density' ? 'g/L' : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-outline">
                                                            {selectedVariety ? varieties.find(v => v.id.toString() === selectedVariety)?.name : 'Global'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            <button
                                                                className="btn btn-primary btn-sm btn-icon"
                                                                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                onClick={handleCreateSave}
                                                                title="Save"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost btn-sm btn-icon"
                                                                style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}
                                                                onClick={() => setIsCreating(false)}
                                                                title="Cancel"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {allParams.map((param, index) => {
                                                const colors = gradeColors[param.grade] || { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563' };
                                                const typeIcons: Record<string, string> = {
                                                    'Moisture': 'water_drop',
                                                    'Density': 'density_medium',
                                                    'Color': 'palette'
                                                };
                                                const varietyName = varieties.find(v => v.id === param.id_variety)?.name || 'Global';

                                                return (
                                                    <tr key={param.id} style={{ background: editingParamId === param.id ? 'var(--bg-surface)' : 'transparent' }}>
                                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{index + 1}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>
                                                                    {typeIcons[param.name] || 'settings'}
                                                                </span>
                                                                <span style={{ fontWeight: 500 }}>{param.name}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                background: colors.border,
                                                                color: 'white',
                                                                padding: '4px 10px',
                                                                borderRadius: 10,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                {param.grade}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {editingParamId === param.id ? (
                                                                <input
                                                                    type="number"
                                                                    className="form-input"
                                                                    value={editingValues.level}
                                                                    onChange={(e) => setEditingValues(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                                                                    min="1"
                                                                    style={{ width: 60, textAlign: 'center', padding: '4px 8px' }}
                                                                />
                                                            ) : (
                                                                <span style={{
                                                                    background: colors.bg,
                                                                    color: colors.text,
                                                                    padding: '4px 10px',
                                                                    borderRadius: 6,
                                                                    fontWeight: 600,
                                                                    fontSize: '0.875rem'
                                                                }}>
                                                                    {param.level || 1}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {editingParamId === param.id ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <input
                                                                        type="number"
                                                                        className="form-input"
                                                                        value={editingValues.min_value}
                                                                        onChange={(e) => setEditingValues(prev => ({ ...prev, min_value: parseFloat(e.target.value) || 0 }))}
                                                                        step="0.1"
                                                                        style={{ width: 70, textAlign: 'center', padding: '4px 8px' }}
                                                                    />
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{param.unit}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontWeight: 500 }}>{param.min_value} {param.unit}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {editingParamId === param.id ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <input
                                                                        type="number"
                                                                        className="form-input"
                                                                        value={editingValues.max_value}
                                                                        onChange={(e) => setEditingValues(prev => ({ ...prev, max_value: parseFloat(e.target.value) || 0 }))}
                                                                        step="0.1"
                                                                        style={{ width: 70, textAlign: 'center', padding: '4px 8px' }}
                                                                    />
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{param.unit}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontWeight: 500 }}>{param.max_value} {param.unit}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                color: param.id_variety ? 'var(--primary)' : 'var(--text-muted)',
                                                                fontWeight: param.id_variety ? 500 : 400
                                                            }}>
                                                                {varietyName}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {editingParamId === param.id ? (
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => handleTableSave(param.id)}
                                                                        style={{ padding: '4px 8px' }}
                                                                    >
                                                                        <span className="material-symbols-outlined icon-sm">check</span>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-ghost btn-sm"
                                                                        onClick={() => setEditingParamId(null)}
                                                                        style={{ padding: '4px 8px' }}
                                                                    >
                                                                        <span className="material-symbols-outlined icon-sm">close</span>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    <button
                                                                        className="btn btn-ghost btn-sm"
                                                                        onClick={() => handleTableEdit(param)}
                                                                        style={{ padding: '4px 8px' }}
                                                                        title="Edit"
                                                                    >
                                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>edit</span>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-ghost btn-sm"
                                                                        onClick={() => showDeleteConfirm(param)}
                                                                        style={{ padding: '4px 8px' }}
                                                                        title="Delete"
                                                                    >
                                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Summary Stats */}
                            {allParams.length > 0 && (
                                <div style={{
                                    marginTop: 20,
                                    padding: 16,
                                    background: 'var(--bg-surface)',
                                    borderRadius: 8,
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 16
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                            {allParams.length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Parameter</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9' }}>
                                            {allParams.filter(p => p.name === 'Moisture').length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moisture</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                                            {allParams.filter(p => p.name === 'Density').length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Density</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                                            {allParams.filter(p => p.name === 'Color').length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Color</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 400,
                        width: '90%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 28 }}>warning</span>
                            <h3 style={{ margin: 0, fontWeight: 600 }}>Konfirmasi Hapus</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Apakah Anda yakin ingin menghapus parameter <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                                disabled={deleting}
                            >
                                Batal
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleTableDelete}
                                disabled={deleting}
                                style={{ background: 'var(--error)' }}
                            >
                                {deleting ? (
                                    <>
                                        <span className="material-symbols-outlined icon-sm animate-spin">sync</span>
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined icon-sm">delete</span>
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    padding: '16px 24px',
                    borderRadius: 12,
                    background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 2000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <span className="material-symbols-outlined">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span style={{ fontWeight: 500 }}>{toast.message}</span>
                </div>
            )}

            <style>{`
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `}</style>
        </>
    );
};

export default QualityConfig;

