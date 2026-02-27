import React, { useState, useEffect } from 'react';
import { qcResultApi, factoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/UI/Pagination';

interface Factory {
    id: number;
    name: string;
}

interface QCResult {
    id: number;
    qc_date: string;
    batch_code: string | null;
    moisture_content: number | null;
    broken_percentage: number | null;
    whiteness_degree: number | null;
    grade: string | null;
    notes: string | null;
    id_factory: number;
    Factory: { id: number; name: string };
    User: { id: number; fullname: string };
    Worksheet: { id: number; batch_code: string | null } | null;
}

const ITEMS_PER_PAGE = 20;

const QCResults = () => {
    const [results, setResults] = useState<QCResult[]>([]);
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
        qc_date: new Date().toISOString().split('T')[0],
        batch_code: '',
        id_worksheet: '',
        moisture_content: '',
        broken_percentage: '',
        whiteness_degree: '',
        grade: '',
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
        fetchResults();
    }, [page, selectedFactory, searchBatch]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            };
            if (selectedFactory) params.id_factory = selectedFactory;
            if (searchBatch) params.batch_code = searchBatch;

            const response = await qcResultApi.getAll(params);
            setResults(response.data.data);
            setTotalItems(response.data.total);
        } catch (error) {
            console.error('Error fetching QC results:', error);
            showError('Error', 'Gagal memuat data QC');
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

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                id_worksheet: formData.id_worksheet ? parseInt(formData.id_worksheet) : undefined,
                moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : undefined,
                broken_percentage: formData.broken_percentage ? parseFloat(formData.broken_percentage) : undefined,
                whiteness_degree: formData.whiteness_degree ? parseFloat(formData.whiteness_degree) : undefined,
            };

            if (isEditMode && currentId) {
                await qcResultApi.update(currentId, payload);
                showSuccess('Sukses', 'Hasil QC berhasil diperbarui');
            } else {
                await qcResultApi.create(payload);
                showSuccess('Sukses', 'Hasil QC berhasil ditambahkan');
            }

            setIsModalOpen(false);
            resetForm();
            fetchResults();
        } catch (error: any) {
            console.error('Error saving QC result:', error);
            showError('Error', error.response?.data?.message || 'Gagal menyimpan hasil QC');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setIsEditMode(false);
        setCurrentId(null);
        setFormData({
            id_factory: selectedFactory || '',
            qc_date: new Date().toISOString().split('T')[0],
            batch_code: '',
            id_worksheet: '',
            moisture_content: '',
            broken_percentage: '',
            whiteness_degree: '',
            grade: '',
            notes: ''
        });
    };

    const handleEdit = (res: QCResult) => {
        setIsEditMode(true);
        setCurrentId(res.id);
        setFormData({
            id_factory: res.id_factory ? res.id_factory.toString() : res.Factory?.id?.toString() || '',
            qc_date: new Date(res.qc_date).toISOString().split('T')[0],
            batch_code: res.batch_code || '',
            id_worksheet: res.Worksheet?.id?.toString() || '',
            moisture_content: res.moisture_content?.toString() || '',
            broken_percentage: res.broken_percentage?.toString() || '',
            whiteness_degree: res.whiteness_degree?.toString() || '',
            grade: res.grade || '',
            notes: res.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Hapus hasil QC ini?')) {
            try {
                await qcResultApi.delete(id);
                showSuccess('Sukses', 'Hasil QC berhasil dihapus');
                fetchResults();
            } catch (error: any) {
                console.error('Error deleting QC result:', error);
                showError('Error', 'Gagal menghapus hasil QC');
            }
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="card-title">QC Produk Jadi (Beras)</h2>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Input Hasil QC
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
                            <span className="material-symbols-outlined rotating" style={{ fontSize: 32 }}>sync</span>
                            <div style={{ marginTop: 8 }}>Memuat data...</div>
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>science</span>
                            <p>Tidak ada hasil QC ditemukan.</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tanggal QC</th>
                                            <th>Batch Code</th>
                                            <th style={{ textAlign: 'center' }}>Kadar Air (%)</th>
                                            <th style={{ textAlign: 'center' }}>Broken (%)</th>
                                            <th style={{ textAlign: 'center' }}>Derajat Sosoh</th>
                                            <th style={{ textAlign: 'center' }}>Grade Akhir</th>
                                            <th>Analis</th>
                                            <th style={{ textAlign: 'center' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res) => (
                                            <tr key={res.id}>
                                                <td>{new Date(res.qc_date).toLocaleDateString()}</td>
                                                <td>
                                                    {res.batch_code ? (
                                                        <span className="badge badge-primary">{res.batch_code}</span>
                                                    ) : '-'}
                                                    {res.Worksheet && (
                                                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                            WS: {res.Worksheet.batch_code || `#${res.Worksheet.id}`}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{res.moisture_content ? Number(res.moisture_content).toFixed(1) : '-'}</td>
                                                <td style={{ textAlign: 'center' }}>{res.broken_percentage ? Number(res.broken_percentage).toFixed(1) : '-'}</td>
                                                <td style={{ textAlign: 'center' }}>{res.whiteness_degree ? Number(res.whiteness_degree).toFixed(1) : '-'}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {res.grade ? (
                                                        <span className={`badge ${res.grade === 'Premium' ? 'badge-success' : res.grade === 'Medium' ? 'badge-warning' : 'badge-secondary'}`}>
                                                            {res.grade}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td>{res.User?.fullname || '-'}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                        <button
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => handleEdit(res)}
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: 18 }}>edit</span>
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-icon btn-sm"
                                                            onClick={() => handleDelete(res.id)}
                                                            title="Hapus"
                                                        >
                                                            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: 18 }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
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
                            <h3 className="modal-title">{isEditMode ? 'Edit Hasil QC Produk Jadi' : 'Input Hasil QC Produk Jadi'}</h3>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleFormSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Tanggal QC</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="qc_date"
                                            value={formData.qc_date}
                                            onChange={handleFormChange}
                                            required
                                        />
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
                                        <label className="form-label">Batch Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="batch_code"
                                            value={formData.batch_code}
                                            onChange={handleFormChange}
                                            placeholder="Contoh: BRS-20260226-001"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ID Worksheet (Opsional)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="id_worksheet"
                                            value={formData.id_worksheet}
                                            onChange={handleFormChange}
                                            placeholder="ID Worksheet terkait"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Kadar Air (%) (Target ≤ 14%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="moisture_content"
                                            value={formData.moisture_content}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Derajat Sosoh (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="whiteness_degree"
                                            value={formData.whiteness_degree}
                                            onChange={handleFormChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Beras Patah / Broken (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="form-control"
                                            name="broken_percentage"
                                            value={formData.broken_percentage}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Grade</label>
                                        <select
                                            className="form-control"
                                            name="grade"
                                            value={formData.grade}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">(Belum ditentukan)</option>
                                            <option value="Premium">Premium</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Reject">Reject / Turun Mutu</option>
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Catatan</label>
                                        <textarea
                                            className="form-control"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleFormChange}
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui QC' : 'Simpan QC')}
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

export default QCResults;
