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

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let initialWt = parseFloat(formData.initial_weight) || 0;
        let finalWt = parseFloat(formData.final_weight) || 0;
        let shrinkage_kg = initialWt - finalWt;
        let shrinkage_pct = initialWt > 0 ? (shrinkage_kg / initialWt) * 100 : 0;

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                initial_weight: initialWt,
                final_weight: finalWt,
                initial_moisture: formData.initial_moisture ? parseFloat(formData.initial_moisture) : undefined,
                final_moisture: formData.final_moisture ? parseFloat(formData.final_moisture) : undefined,
                downtime_hours: formData.downtime_hours ? parseFloat(formData.downtime_hours) : undefined,
                shrinkage_kg,
                shrinkage_pct
            };

            await dryingLogApi.create(payload);
            showSuccess('Sukses', 'Catatan Pengeringan berhasil ditambahkan');
            setIsModalOpen(false);
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
            fetchLogs();
        } catch (error: any) {
            console.error('Error creating drying log:', error);
            showError('Error', error.response?.data?.message || 'Gagal menambahkan log pengeringan');
        } finally {
            setSubmitting(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="card-title">Drying Log (Pengeringan)</h2>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Tambah Log
                    </button>
                </div>

                <div className="card-body">
                    <div className="filters-container" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
                            <select
                                className="form-control"
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
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <div className="input-icon">
                                <span className="material-symbols-outlined">search</span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cari Batch Code..."
                                    value={searchBatch}
                                    onChange={(e) => {
                                        setSearchBatch(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <LogoLoader />
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>sunny</span>
                            <p>Tidak ada catatan pengeringan ditemukan.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Batch Code</th>
                                            <th>Metode</th>
                                            <th style={{ textAlign: 'right' }}>Berat Awal (kg)</th>
                                            <th style={{ textAlign: 'right' }}>Berat Akhir (kg)</th>
                                            <th style={{ textAlign: 'right' }}>K.A. Awal (%)</th>
                                            <th style={{ textAlign: 'right' }}>K.A. Akhir (%)</th>
                                            <th style={{ textAlign: 'right' }}>Total Susut</th>
                                            <th>Dicatat Oleh</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.drying_date).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge badge-primary">{log.batch_code}</span>
                                                </td>
                                                <td>{log.method.replace('_', ' ')}</td>
                                                <td style={{ textAlign: 'right' }}>{Number(log.initial_weight).toLocaleString('id-ID')}</td>
                                                <td style={{ textAlign: 'right' }}>{Number(log.final_weight).toLocaleString('id-ID')}</td>
                                                <td style={{ textAlign: 'right' }}>{log.initial_moisture ? Number(log.initial_moisture).toFixed(1) : '-'}</td>
                                                <td style={{ textAlign: 'right' }}>{log.final_moisture ? Number(log.final_moisture).toFixed(1) : '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {log.shrinkage_kg ? (
                                                        <div style={{ color: 'var(--danger-color)', fontWeight: 500 }}>
                                                            {Number(log.shrinkage_pct).toFixed(2)}%
                                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                                                ({Number(log.shrinkage_kg).toLocaleString('id-ID')} kg)
                                                            </div>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td>{log.User?.fullname || '-'}</td>
                                            </tr>
                                        ))}
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
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Tambah Log Pengeringan</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCreateSubmit}>
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
                                        {submitting ? 'Menyimpan...' : 'Simpan Log'}
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
