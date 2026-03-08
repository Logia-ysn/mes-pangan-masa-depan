import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

    const [formData, setFormData] = useState({
        id_factory: 1, // Defaulting to 1 for simplicity, ideally from context
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
            setNcrs(data.data || data); // Adjust based on your API response structure
        } catch (error) {
            console.error('Failed to fetch NCRs', error);
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
                toast.success('NCR updated successfully');
            } else {
                await api.post('/ncr', formData);
                toast.success('NCR created successfully');
            }
            setIsModalOpen(false);
            fetchNCRs();
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const handleResolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNcr) return;

        try {
            await api.post(`/ncr/${selectedNcr.id}/resolve`, resolveData);
            toast.success('NCR resolution submitted');
            setIsResolveModalOpen(false);
            fetchNCRs();
        } catch (error) {
            console.error('Resolve error:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-500/20 text-red-500 border-red-500/50';
            case 'MAJOR': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
            case 'MINOR': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CLOSED': return 'bg-green-500/20 text-green-500';
            case 'ACTION_TAKEN': return 'bg-blue-500/20 text-blue-500';
            case 'INVESTIGATING': return 'bg-purple-500/20 text-purple-500';
            case 'OPEN': return 'bg-red-500/20 text-red-500';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Non-Conformance Reports</h1>
                    <p className="text-gray-400 text-sm">Validasi kualitas dan tindakan perbaikan (Corrective Action)</p>
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
                    className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    + Buat Laporan NCR
                </button>
            </div>

            <div className="bg-dark-700 rounded-xl shadow-lg border border-border">
                <div className="p-4 border-b border-border text-lg font-semibold text-white">
                    Daftar Log NCR
                </div>
                <div className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-dark-600 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">No. Report</th>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3">Isu/Problem</th>
                                        <th className="px-4 py-3">Severity</th>
                                        <th className="px-4 py-3">Batch/Group</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-600">
                                    {ncrs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada data NCR</td>
                                        </tr>
                                    ) : (
                                        ncrs.map((ncr) => (
                                            <tr key={ncr.id} className="hover:bg-dark-600/50 transition-colors">
                                                <td className="px-4 py-4 font-medium text-white">{ncr.report_number}</td>
                                                <td className="px-4 py-4 text-gray-300">
                                                    {new Date(ncr.report_date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-4 py-4 text-gray-300">
                                                    <div className="font-medium text-white">{ncr.issue_title}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{ncr.description}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(ncr.severity)}`}>
                                                        {ncr.severity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-300">{ncr.batch_code || '-'}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ncr.status)}`}>
                                                        {ncr.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedNcr(ncr);
                                                            setFormData({
                                                                id_factory: 1, // Assume 1 for now
                                                                report_date: new Date(ncr.report_date).toISOString().slice(0, 16),
                                                                issue_title: ncr.issue_title,
                                                                description: ncr.description,
                                                                severity: ncr.severity,
                                                                batch_code: ncr.batch_code || '',
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                        title="Edit"
                                                    >
                                                        Tinjau
                                                    </button>

                                                    {ncr.status !== 'CLOSED' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedNcr(ncr);
                                                                setResolveData({
                                                                    action_plan: ncr.action_plan || '',
                                                                    action_taken: ncr.action_taken || '',
                                                                    status: ncr.status === 'ACTION_TAKEN' ? 'CLOSED' : 'ACTION_TAKEN'
                                                                });
                                                                setIsResolveModalOpen(true);
                                                            }}
                                                            className="text-brand-400 hover:text-brand-300 transition-colors"
                                                        >
                                                            Tindak Lanjut
                                                        </button>
                                                    )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-dark-700 p-6 rounded-xl border border-dark-600 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {selectedNcr ? 'Edit Laporan NCR' : 'Buat Laporan NCR'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Judul Isu</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.issue_title}
                                    onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                                    placeholder="Contoh: Kemasan beras bocor"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tingkat Keparahan (Severity)</label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                    >
                                        <option value="MINOR">MINOR</option>
                                        <option value="MAJOR">MAJOR</option>
                                        <option value="CRITICAL">CRITICAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal & Waktu</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.report_date}
                                        onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                                        className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Batch Code (Opsional)</label>
                                <input
                                    type="text"
                                    value={formData.batch_code}
                                    onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                                    placeholder="No. Batch terkait deviasi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Deskripsi Detail</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                                    placeholder="Jelaskan secara rinci kronologi dan temuan deviasi kualitas..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-dark-600">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Simpan Laporan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {isResolveModalOpen && selectedNcr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-dark-700 p-6 rounded-xl border border-dark-600 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-2">Tindak Lanjut NCR</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            No. Report: <span className="text-white font-medium">{selectedNcr.report_number}</span>
                        </p>

                        <form onSubmit={handleResolve} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Rencana Tindakan (Action Plan)</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={resolveData.action_plan}
                                    onChange={(e) => setResolveData({ ...resolveData, action_plan: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                                    placeholder="Rencana aksi perbaikan..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tindakan Selesai (Action Taken)</label>
                                <textarea
                                    rows={2}
                                    value={resolveData.action_taken}
                                    onChange={(e) => setResolveData({ ...resolveData, action_taken: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
                                    placeholder="Apa yang sudah dieksekusi untuk memperbaiki masalah ini?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Update Status</label>
                                <select
                                    value={resolveData.status}
                                    onChange={(e) => setResolveData({ ...resolveData, status: e.target.value })}
                                    className="w-full bg-dark-600 border border-dark-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                                >
                                    <option value="INVESTIGATING">INVESTIGATING</option>
                                    <option value="ACTION_TAKEN">ACTION TAKEN</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-dark-600">
                                <button
                                    type="button"
                                    onClick={() => setIsResolveModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Simpan Tindak Lanjut
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NonConformance;
