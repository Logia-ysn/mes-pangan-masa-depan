import React, { useState, useEffect } from 'react';
import { factoryApi, qcResultApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/UI/Pagination';
import { Plus, Search, FlaskConical, Edit2, Trash2, X, Factory as FactoryIcon, CheckCircle2, AlertTriangle, XCircle, Calendar } from 'lucide-react';

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

    const getGradeBadge = (grade: string | null) => {
        if (!grade) return <span className="text-slate-400 font-medium">-</span>;
        switch (grade.toLowerCase()) {
            case 'premium':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Premium</span>;
            case 'medium':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><CheckCircle2 className="w-3.5 h-3.5" /> Medium</span>;
            case 'reject':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Reject</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200"><AlertTriangle className="w-3.5 h-3.5" /> {grade}</span>;
        }
    };

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(139, 92, 246, 0.2)'
                    }}>
                        <FlaskConical className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>QC Produk Jadi</h1>
                        <p className="page-subtitle">Inspeksi kualitas harian dan penentuan grade hasil giling</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary"
                    style={{ paddingLeft: 20, paddingRight: 24 }}
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Input Hasil QC
                </button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 16 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="form-control"
                            style={{ paddingLeft: 40, border: 'none', background: 'var(--bg-surface)' }}
                            placeholder="Cari Batch Code..."
                            value={searchBatch}
                            onChange={(e) => {
                                setSearchBatch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FactoryIcon className="w-5 h-5 text-slate-400" />
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
                </div>

                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '100px 0', textAlign: 'center' }}>
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">Analyzing Quality Data</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="empty-state" style={{ padding: '100px 24px' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                color: 'var(--text-muted)'
                            }}>
                                <FlaskConical className="h-10 w-10" />
                            </div>
                            <h3>Tidak ada hasil QC</h3>
                            <p>Sesuaikan filter atau klik "Input Hasil QC" untuk merekam data baru.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 24 }}>Batch & Tanggal</th>
                                        <th style={{ textAlign: 'center' }}>K.A (%)</th>
                                        <th style={{ textAlign: 'center' }}>Patah (%)</th>
                                        <th style={{ textAlign: 'center' }}>Sosoh (%)</th>
                                        <th style={{ textAlign: 'center' }}>Grade Akhir</th>
                                        <th>Analis</th>
                                        <th style={{ textAlign: 'right', paddingRight: 24 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((res) => (
                                        <tr key={res.id} className="premium-row">
                                            <td style={{ paddingLeft: 24 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{res.batch_code || '-'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(res.qc_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    fontSize: 14, fontWeight: 800,
                                                    color: Number(res.moisture_content) > 14 ? 'var(--error)' : 'var(--text-primary)'
                                                }}>
                                                    {res.moisture_content ? Number(res.moisture_content).toFixed(1) : '-'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{res.broken_percentage ? Number(res.broken_percentage).toFixed(1) : '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{res.whiteness_degree ? Number(res.whiteness_degree).toFixed(1) : '-'}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {getGradeBadge(res.grade)}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                                                        {res.User?.fullname?.charAt(0) || 'U'}
                                                    </div>
                                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{res.User?.fullname || 'System'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(res)}>
                                                        <Edit2 className="w-4 h-4 text-primary" />
                                                    </button>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(res.id)}>
                                                        <Trash2 className="w-4 h-4 text-error" />
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

                {results.length > 0 && (
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

            {/* Modal Input/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-primary" />
                                {isEditMode ? 'Edit Hasil QC Produk Jadi' : 'Input Hasil QC Produk Jadi'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-muted-foreground hover:bg-muted p-1.5 rounded-md transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="qcForm" onSubmit={handleFormSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tanggal QC <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            name="qc_date"
                                            value={formData.qc_date}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Pabrik <span className="text-red-500">*</span></label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Batch Code</label>
                                        <input
                                            type="text"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            name="batch_code"
                                            value={formData.batch_code}
                                            onChange={handleFormChange}
                                            placeholder="Contoh: BRS-20260226-001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ID Worksheet (Opsional)</label>
                                        <input
                                            type="number"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            name="id_worksheet"
                                            value={formData.id_worksheet}
                                            onChange={handleFormChange}
                                            placeholder="ID Worksheet terkait"
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                                    <h4 className="font-semibold text-sm border-b pb-2">Parameter Kualitas</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">Kadar Air (%) <span className="text-[10px] text-green-600">≤ 14%</span></label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary"
                                                name="moisture_content"
                                                value={formData.moisture_content}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">Beras Patah (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary"
                                                name="broken_percentage"
                                                value={formData.broken_percentage}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">Derajat Sosoh (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary"
                                                name="whiteness_degree"
                                                value={formData.whiteness_degree}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Keputusan Grade Akhir</label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Catatan Analis</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleFormChange}
                                        rows={3}
                                        placeholder="Tambahkan observasi visual atau keterangan khusus..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="qcForm"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>Menyimpan...</>
                                ) : (
                                    isEditMode ? 'Simpan Perubahan' : 'Proses QC'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QCResults;
