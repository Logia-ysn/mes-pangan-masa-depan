import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, AlertTriangle, CheckCircle2, FileWarning, Eye, Activity, Filter, Clock } from 'lucide-react';

interface NCR {
    id: number;
    report_number: string;
    report_date: string;
    issue_title: string;
    description: string;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    status: 'DRAFT' | 'OPEN' | 'INVESTIGATING' | 'ACTION_TAKEN' | 'CLOSED';
    batch_code?: string;
    id_worksheet?: number;
    action_plan?: string;
    action_taken?: string;
    reported_by: number;
    reporter?: { fullname: string };
    resolved_by?: number;
    resolver?: { fullname: string };
    resolved_at?: string;
}

const NonConformance: React.FC = () => {
    const [ncrs, setNcrs] = useState<NCR[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [selectedNcr, setSelectedNcr] = useState<NCR | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    const [formData, setFormData] = useState({
        id_factory: 1,
        report_date: new Date().toISOString().slice(0, 16),
        issue_title: '',
        description: '',
        severity: 'MINOR',
        batch_code: '',
    });

    const [resolveData, setResolveData] = useState({
        action_plan: '',
        action_taken: '',
        status: 'ACTION_TAKEN'
    });

    const fetchNCRs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/ncr');
            setNcrs(data.data || data);
        } catch (error) {
            console.error('Failed to fetch NCRs', error);
            toast.error('Gagal mengambil data NCR');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNCRs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedNcr) {
                await api.put(`/ncr/${selectedNcr.id}`, formData);
                toast.success('NCR berhasil diperbarui');
            } else {
                await api.post('/ncr', formData);
                toast.success('NCR berhasil dibuat');
            }
            setIsModalOpen(false);
            fetchNCRs();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Gagal menyimpan NCR');
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNcr) return;

        try {
            await api.post(`/ncr/${selectedNcr.id}/resolve`, resolveData);
            toast.success('Tindak lanjut NCR berhasil disimpan');
            setIsResolveModalOpen(false);
            fetchNCRs();
        } catch (error) {
            console.error('Resolve error:', error);
            toast.error('Gagal menyimpan tindak lanjut');
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Kritis</span>;
            case 'MAJOR':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20"><FileWarning className="w-3.5 h-3.5" /> Mayor</span>;
            case 'MINOR':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Minor</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">{severity}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CLOSED':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Closed</span>;
            case 'ACTION_TAKEN':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Activity className="w-3.5 h-3.5" /> Action Taken</span>;
            case 'INVESTIGATING':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Search className="w-3.5 h-3.5" /> Investigasi</span>;
            case 'OPEN':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Open</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
        }
    };

    const filteredNcrs = ncrs.filter(ncr => {
        const matchesSearch = ncr.report_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncr.issue_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ncr.batch_code && ncr.batch_code.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || ncr.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--error), #f43f5e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(244, 63, 94, 0.2)'
                    }}>
                        <FileWarning className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Non-Conformance Reports</h1>
                        <p className="page-subtitle">Validasi kualitas, pencatatan deviasi, dan Corrective Action</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedNcr(null);
                        setFormData({
                            id_factory: 1,
                            report_date: new Date().toISOString().slice(0, 16),
                            issue_title: '',
                            description: '',
                            severity: 'MINOR',
                            batch_code: '',
                        });
                        setIsModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, var(--error), #f43f5e)', border: 'none' }}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Buat Laporan NCR
                </button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Filters */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', gap: 16 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            className="form-control"
                            style={{ paddingLeft: 40, border: 'none', background: 'var(--bg-surface)' }}
                            placeholder="Cari No. Laporan, Judul Isu, atau Batch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            className="form-control"
                            style={{ width: 200, border: 'none', background: 'var(--bg-surface)' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">Semua Status</option>
                            <option value="OPEN">Open</option>
                            <option value="INVESTIGATING">Investigasi</option>
                            <option value="ACTION_TAKEN">Action Taken</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: '100px 0', textAlign: 'center' }}>
                            <div className="w-10 h-10 border-4 border-error/20 border-t-error rounded-full animate-spin mx-auto mb-4"></div>
                            <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">Fetching Deviation Data</span>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: 24 }}>Identifikasi</th>
                                        <th>Isu & Deskripsi</th>
                                        <th style={{ textAlign: 'center' }}>Severity</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th style={{ textAlign: 'right', paddingRight: 24 }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNcrs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '100px 24px' }}>
                                                <div className="empty-state">
                                                    <div style={{
                                                        width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                                                        color: 'var(--text-muted)'
                                                    }}>
                                                        <CheckCircle2 className="w-8 h-8" />
                                                    </div>
                                                    <h3 style={{ color: 'var(--text-primary)' }}>Semua Aman</h3>
                                                    <p style={{ color: 'var(--text-muted)' }}>Tidak ada laporan ketidaksesuaian ditemukan.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredNcrs.map((ncr) => (
                                            <tr key={ncr.id} className="premium-row">
                                                <td style={{ paddingLeft: 24 }}>
                                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>{ncr.report_number}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(ncr.report_date).toLocaleString('id-ID', { dateStyle: 'medium' })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ncr.issue_title}</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 350 }} className="line-clamp-1">
                                                        {ncr.description}
                                                    </div>
                                                    {ncr.batch_code && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, background: 'var(--bg-elevated)',
                                                            padding: '2px 8px', borderRadius: 4, color: 'var(--primary)',
                                                            border: '1px solid var(--border-subtle)', marginTop: 6, display: 'inline-block'
                                                        }}>
                                                            BATCH: {ncr.batch_code}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{getSeverityBadge(ncr.severity)}</td>
                                                <td style={{ textAlign: 'center' }}>{getStatusBadge(ncr.status)}</td>
                                                <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedNcr(ncr);
                                                                setFormData({
                                                                    id_factory: 1,
                                                                    report_date: new Date(ncr.report_date).toISOString().slice(0, 16),
                                                                    issue_title: ncr.issue_title,
                                                                    description: ncr.description,
                                                                    severity: ncr.severity,
                                                                    batch_code: ncr.batch_code || '',
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="btn btn-ghost btn-sm btn-icon"
                                                            title="Edit"
                                                        >
                                                            <Eye className="w-4 h-4 text-primary" />
                                                        </button>

                                                        {ncr.status !== 'CLOSED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedNcr(ncr);
                                                                    setResolveData({
                                                                        action_plan: ncr.action_plan || '',
                                                                        action_taken: ncr.action_taken || '',
                                                                        status: ncr.status === 'ACTION_TAKEN' ? 'CLOSED' : (ncr.status === 'OPEN' ? 'INVESTIGATING' : 'ACTION_TAKEN')
                                                                    });
                                                                    setIsResolveModalOpen(true);
                                                                }}
                                                                className="btn btn-sm"
                                                                style={{
                                                                    height: 32, fontSize: 11, fontWeight: 700,
                                                                    background: 'rgba(19, 127, 236, 0.1)', color: 'var(--primary)',
                                                                    border: '1px solid rgba(19, 127, 236, 0.2)', borderRadius: 8
                                                                }}
                                                            >
                                                                Tindak Lanjut
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark-700/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileWarning className="w-6 h-6 text-brand-500" />
                                {selectedNcr ? 'Edit Laporan NCR' : 'Buat Laporan NCR Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <Eye className="w-5 h-5 opacity-0" /> {/* Spacer */}
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="ncr-form" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Judul Isu</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.issue_title}
                                        onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                        placeholder="Contoh: Kemasan beras bocor / Kualitas warna tidak standar"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Tingkat Keparahan (Severity)</label>
                                        <div className="relative">
                                            <select
                                                value={formData.severity}
                                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                                className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            >
                                                <option value="MINOR">MINOR - Berdampak kecil</option>
                                                <option value="MAJOR">MAJOR - Berdampak signifikan</option>
                                                <option value="CRITICAL">CRITICAL - Berbahaya / Fatal</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                {formData.severity === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                {formData.severity === 'MAJOR' && <FileWarning className="w-4 h-4 text-orange-400" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Tanggal Laporan</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.report_date}
                                            onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                                            className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Batch Code Terkait (Opsional)</label>
                                    <input
                                        type="text"
                                        value={formData.batch_code}
                                        onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all"
                                        placeholder="Contoh: BATCH-202310-001"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">Tautkan ke kode produksi bila deviasi berhubungan dengan hasil produksi spesifik.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi Detail Temuan</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                                        placeholder="Jelaskan secara rinci kronologi, siapa yang menemukan, dan seberapa luas deviasi kualitas yang terjadi..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-dark-700/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="ncr-form"
                                className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20"
                            >
                                Simpan Laporan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {isResolveModalOpen && selectedNcr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsResolveModalOpen(false)}></div>
                    <div className="relative bg-dark-800 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 bg-dark-700/50">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                <Activity className="w-6 h-6 text-brand-400" />
                                Tindak Lanjut Perbaikan
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm">No. Laporan:</span>
                                <span className="px-2.5 py-1 bg-dark-900 border border-white/10 rounded-lg text-white font-mono text-sm">{selectedNcr.report_number}</span>
                                {getSeverityBadge(selectedNcr.severity)}
                            </div>
                        </div>

                        <div className="p-6">
                            <form id="resolve-form" onSubmit={handleResolve} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center justify-between">
                                        Rencana Tindakan (Action Plan)
                                        <span className="text-xs text-gray-500 font-normal">Wajib diisi di awal</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={resolveData.action_plan}
                                        onChange={(e) => setResolveData({ ...resolveData, action_plan: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
                                        placeholder="Rencana aksi perbaikan untuk mencegah masalah berulang..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center justify-between">
                                        Tindakan yang Diselesaikan (Action Taken)
                                        <span className="text-xs text-gray-500 font-normal">Bisa diisi nanti</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={resolveData.action_taken}
                                        onChange={(e) => setResolveData({ ...resolveData, action_taken: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-all resize-none"
                                        placeholder="Apa yang sudah dieksekusi sejauh ini? Bila sudah rampung, silakan detail di sini."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Ubah Status Proses</label>
                                    <select
                                        value={resolveData.status}
                                        onChange={(e) => setResolveData({ ...resolveData, status: e.target.value })}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:border-brand-500 transition-all"
                                    >
                                        <option value="INVESTIGATING">INVESTIGASI - Sedang mencari akar penyebab</option>
                                        <option value="ACTION_TAKEN">ACTION TAKEN - Tindakan sedang/telah dilakukan</option>
                                        <option value="CLOSED">CLOSED - Masalah selesai & ditutup</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-dark-700/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsResolveModalOpen(false)}
                                className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="resolve-form"
                                className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20"
                            >
                                Simpan Tindak Lanjut
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NonConformance;
