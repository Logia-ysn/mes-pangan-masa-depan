import React, { useState, useEffect } from 'react';
import { dryingLogApi, factoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/UI/Pagination';
import LogoLoader from '../../components/UI/LogoLoader';

interface Factory {
    id: number;
    name: string;
}

interface DryingLog {
    id: number;
    batch_code: string;
    drying_date: string;
    method: string;
    initial_weight: number;
    final_weight: number;
    initial_moisture: number | null;
    final_moisture: number | null;
    downtime_hours: number | null;
    shrinkage_kg: number | null;
    shrinkage_pct: number | null;
    notes: string | null;
    id_factory: number;
    Factory: { id: number; name: string };
    User: { id: number; fullname: string };
}

const ITEMS_PER_PAGE = 20;

const DryingLogs = () => {
    const [logs, setLogs] = useState<DryingLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<string>('');
    const [searchBatch, setSearchBatch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id_factory: '',
        batch_code: '',
        drying_date: new Date().toISOString().split('T')[0],
        method: 'SUN_DRY',
        initial_weight: '',
        final_weight: '',
        initial_moisture: '',
        final_moisture: '',
        downtime_hours: '',
        notes: ''
    });

    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const fetchFactories = async () => {
            try {
                const response = await factoryApi.getAll();
                const data = response.data?.data || response.data || [];
                setFactories(data as Factory[]);
                if (data.length > 0) {
                    setSelectedFactory(data[0].id.toString());
                    setFormData(prev => ({ ...prev, id_factory: data[0].id.toString() }));
                }
            } catch (error) {
                console.error('Error fetching factories:', error);
            }
        };
        fetchFactories();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, selectedFactory, searchBatch]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            };
            if (selectedFactory) params.id_factory = selectedFactory;
            if (searchBatch) params.batch_code = searchBatch;

            const response = await dryingLogApi.getAll(params);
            setLogs(response.data.data);
            setTotalItems(response.data.total);
        } catch (error) {
            console.error('Error fetching drying logs:', error);
            showError('Error', 'Gagal memuat data pengeringan');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let initialWt = parseFloat(formData.initial_weight) || 0;
        let finalWt = parseFloat(formData.final_weight) || 0;

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                initial_weight: initialWt,
                final_weight: finalWt,
                initial_moisture: formData.initial_moisture ? parseFloat(formData.initial_moisture) : undefined,
                final_moisture: formData.final_moisture ? parseFloat(formData.final_moisture) : undefined,
                downtime_hours: formData.downtime_hours ? parseFloat(formData.downtime_hours) : undefined,
            };

            if (isEditMode && currentId) {
                await dryingLogApi.update(currentId, payload);
                showSuccess('Sukses', 'Catatan Pengeringan berhasil diperbarui');
            } else {
                await dryingLogApi.create(payload);
                showSuccess('Sukses', 'Catatan Pengeringan berhasil ditambahkan');
            }

            setIsModalOpen(false);
            resetForm();
            fetchLogs();
        } catch (error: any) {
            console.error('Error saving drying log:', error);
            showError('Error', error.response?.data?.message || 'Gagal menyimpan log pengeringan');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setCurrentId(null);
        setFormData({
            id_factory: selectedFactory || '',
            batch_code: '',
            drying_date: new Date().toISOString().split('T')[0],
            method: 'SUN_DRY',
            initial_weight: '',
            final_weight: '',
            initial_moisture: '',
            final_moisture: '',
            downtime_hours: '',
            notes: ''
        });
    };

    const handleEdit = (log: DryingLog) => {
        setIsEditMode(true);
        setCurrentId(log.id);
        setFormData({
            id_factory: log.id_factory ? log.id_factory.toString() : log.Factory?.id?.toString() || '',
            batch_code: log.batch_code,
            drying_date: new Date(log.drying_date).toISOString().split('T')[0],
            method: log.method,
            initial_weight: log.initial_weight.toString(),
            final_weight: log.final_weight.toString(),
            initial_moisture: log.initial_moisture?.toString() || '',
            final_moisture: log.final_moisture?.toString() || '',
            downtime_hours: log.downtime_hours?.toString() || '',
            notes: log.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Hapus catatan pengeringan ini?')) {
            try {
                await dryingLogApi.delete(id);
                showSuccess('Sukses', 'Catatan Pengeringan berhasil dihapus');
                fetchLogs();
            } catch (error: any) {
                console.error('Error deleting drying log:', error);
                showError('Error', 'Gagal menghapus log pengeringan');
            }
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32 }}>sunny</span>
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Drying Log (Pengeringan)</h1>
                        <p className="page-subtitle">Monitor kadar air dan penyusutan bahan baku</p>
                    </div>
                </div>
                <button className="btn btn-primary" style={{ paddingLeft: 20, paddingRight: 24 }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <span className="material-symbols-outlined" style={{ marginRight: 8 }}>add_circle</span>
                    Tambah Log Baru
                </button>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-4" style={{ gap: 20, marginBottom: 24 }}>
                <div className="glass-card premium-hover" style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>TOTAL BATCH</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{totalItems}</div>
                </div>
                <div className="glass-card premium-hover" style={{ padding: 20, borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>AVG SHRINKAGE</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {logs.length > 0 ? (logs.reduce((acc, curr) => acc + (curr.shrinkage_pct || 0), 0) / logs.length).toFixed(2) : 0}%
                    </div>
                </div>
                <div className="glass-card premium-hover" style={{ padding: 20, borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>AVG MOISTURE (OUT)</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {logs.length > 0 ? (logs.reduce((acc, curr) => acc + (curr.final_moisture || 0), 0) / logs.length).toFixed(1) : 0}%
                    </div>
                </div>
                <div className="glass-card premium-hover" style={{ padding: 20, borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>AVG PROCESS TIME</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {logs.length > 0 ? (logs.reduce((acc, curr) => acc + (curr.downtime_hours || 0), 0) / logs.length).toFixed(1) : 0}d
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 16 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 20 }}>search</span>
                        <input
                            type="text"
                            className="form-control"
                            style={{ paddingLeft: 40, border: 'none', background: 'var(--bg-surface)' }}
                            placeholder="Cari Batch Code (Gbh-xxxx)..."
                            value={searchBatch}
                            onChange={(e) => {
                                setSearchBatch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <select
                        className="form-control"
                        style={{ width: 220, border: 'none', background: 'var(--bg-surface)' }}
                        value={selectedFactory}
                        onChange={(e) => {
                            setSelectedFactory(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Semua Pabrik</option>
                        {factories.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '100px 0', textAlign: 'center' }}><LogoLoader /></div>
                    ) : logs.length === 0 ? (
                        <div className="empty-state" style={{ padding: '100px 24px' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                color: 'var(--text-muted)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 40 }}>data_loss_prevention</span>
                            </div>
                            <h3>Tidak ada catatan pengeringan</h3>
                            <p>Sesuaikan filter atau klik "Tambah Log" untuk merekam data baru.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 24 }}>Batch & Tanggal</th>
                                        <th>Metode</th>
                                        <th style={{ textAlign: 'center' }}>Proses</th>
                                        <th style={{ textAlign: 'center' }}>Moisture (%)</th>
                                        <th style={{ textAlign: 'center' }}>Susut (%)</th>
                                        <th>Operator</th>
                                        <th style={{ textAlign: 'center' }}>Detail</th>
                                        <th style={{ textAlign: 'right', paddingRight: 24 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="premium-row">
                                            <td style={{ paddingLeft: 24 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.batch_code}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_today</span>
                                                    {new Date(log.drying_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: log.method === 'SUN_DRY' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(19, 127, 236, 0.1)',
                                                        color: log.method === 'SUN_DRY' ? 'var(--warning)' : 'var(--primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                                            {log.method === 'SUN_DRY' ? 'wb_sunny' : 'cyclone'}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                                                        {log.method === 'SUN_DRY' ? 'Sun Dry' : (log.method === 'MECHANICAL_DRYER' ? 'Mechanical' : 'Mixed')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{log.initial_weight.toLocaleString('id-ID')}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kg Input</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 600 }}>{log.initial_moisture || '-'}</div>
                                                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>IN</div>
                                                    </div>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--border-color)' }}>arrow_forward</span>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)' }}>{log.final_moisture || '-'}</div>
                                                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>OUT</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {log.shrinkage_pct ? (
                                                    <div style={{
                                                        display: 'inline-flex', padding: '4px 10px', borderRadius: 20,
                                                        background: 'rgba(244, 63, 94, 0.1)', color: 'var(--error)',
                                                        fontSize: 12, fontWeight: 800, alignItems: 'center', gap: 4
                                                    }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_down</span>
                                                        {Number(log.shrinkage_pct).toFixed(2)}%
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                                                        {log.User?.fullname?.charAt(0) || 'U'}
                                                    </div>
                                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.User?.fullname || 'System'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {log.notes && (
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ color: 'var(--text-muted)', cursor: 'help', fontSize: 18 }}
                                                        title={log.notes}
                                                    >info</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(log)}>
                                                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 18 }}>edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(log.id)}>
                                                        <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 18 }}>delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {logs.length > 0 && (
                    <div style={{ padding: '0 24px 20px' }}>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={totalItems}
                        />
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isEditMode ? 'Edit Log Pengeringan' : 'Tambah Log Pengeringan'}</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleFormSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Batch Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="batch_code"
                                            value={formData.batch_code}
                                            onChange={handleFormChange}
                                            required
                                            placeholder="Contoh: GBH-20260226-001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal Pengeringan</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="drying_date"
                                            value={formData.drying_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Metode Pengeringan</label>
                                        <select
                                            className="form-control"
                                            name="method"
                                            value={formData.method}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="SUN_DRY">Lantai Jemur (Sun Dry)</option>
                                            <option value="MECHANICAL_DRYER">Mesin Pengering (Dryer)</option>
                                            <option value="MIXED">Campuran</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Pabrik</label>
                                        <select
                                            className="form-control"
                                            name="id_factory"
                                            value={formData.id_factory}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            {factories.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Berat Awal (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="initial_weight"
                                            value={formData.initial_weight}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Berat Akhir (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="final_weight"
                                            value={formData.final_weight}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Kadar Air Awal (%) (Opsional)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="initial_moisture"
                                            value={formData.initial_moisture}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Kadar Air Akhir (%) (Opsional)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="final_moisture"
                                            value={formData.final_moisture}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Durasi / Hari (Opsional)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="downtime_hours"
                                            value={formData.downtime_hours}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Catatan Tambahan (Opsional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>

                                {formData.initial_weight && formData.final_weight && (
                                    <div style={{ padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Estimasi Susut Berat</div>
                                            <div style={{ fontWeight: 600 }}>{(parseFloat(formData.initial_weight) - parseFloat(formData.final_weight)).toLocaleString('id-ID')} kg</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Persentase Susut</div>
                                            <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>
                                                {((parseFloat(formData.initial_weight) - parseFloat(formData.final_weight)) / parseFloat(formData.initial_weight) * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui Log' : 'Simpan Log')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DryingLogs;
