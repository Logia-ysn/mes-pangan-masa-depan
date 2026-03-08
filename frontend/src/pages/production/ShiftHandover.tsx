import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { handoverApi } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface HandoverLog {
    id: number;
    date: string;
    shift: string;
    status: string;
    notes: string;
    issues_reported?: string;
    created_at: string;
    Factory: { name: string };
    OutgoingUser: { fullname: string };
    IncomingUser?: { fullname: string };
}

export default function ShiftHandover() {
    const [logs, setLogs] = useState<HandoverLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [factories, setFactories] = useState<{ id: number, name: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLog, setNewLog] = useState({
        id_factory: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        shift: 'SHIFT_1',
        notes: '',
        issues_reported: ''
    });

    useEffect(() => {
        loadData().catch(() => { });
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logRes, facRes] = await Promise.all([
                handoverApi.getHandovers(),
                api.get('/factories')
            ]);
            setLogs(logRes.data?.data || []);
            const facList = facRes.data?.data || facRes.data;
            setFactories(Array.isArray(facList) ? facList : []);
        } catch (err) {
            toast.error('Gagal memuat log handover');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handoverApi.createHandover({
                ...newLog,
                id_factory: Number(newLog.id_factory),
                date: new Date(newLog.date).toISOString()
            });
            toast.success('Shift Handover disimpan.');
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Gagal menyimpan');
        }
    };

    const handleAcknowledge = async (id: number) => {
        try {
            await handoverApi.acknowledgeHandover(id);
            toast.success('Handover diterima.');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Gagal menerima handover');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shift Handover Log</h1>
                    <p className="text-muted-foreground">Catatan digital serah terima regu jaga produksi</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                    [+] Buat Handover
                </button>
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center border rounded flex-col">
                    <Clock className="animate-spin text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Memuat data...</span>
                </div>
            ) : (
                <div className="grid gap-4">
                    {logs.map(log => (
                        <div key={log.id} className={`p-4 border rounded-lg shadow-sm ${log.status === 'ACKNOWLEDGED' ? 'bg-muted/20' : 'bg-card'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <h3 className="font-bold">{log.Factory.name} - {log.shift}</h3>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-semibold ${log.status === 'ACKNOWLEDGED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {log.status}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <div className="text-muted-foreground text-xs">Tanggal</div>
                                    <div className="font-medium">{format(parseISO(log.date), 'dd MMM yyyy')}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs">Regu Keluar</div>
                                    <div className="font-medium">{log.OutgoingUser.fullname}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-muted-foreground text-xs">Catatan Operasional</div>
                                    <div className="p-2 bg-muted/30 rounded mt-1">{log.notes}</div>
                                </div>
                                {log.issues_reported && (
                                    <div className="col-span-2">
                                        <div className="text-rose-500 text-xs flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Isu Dilaporkan
                                        </div>
                                        <div className="p-2 bg-rose-50 text-rose-800 rounded mt-1 border border-rose-100">
                                            {log.issues_reported}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="pt-3 border-t flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                    {log.status === 'ACKNOWLEDGED' ? `Diterima oleh ${log.IncomingUser?.fullname}` : 'Menunggu Penerimaan Regu Pengganti'}
                                </div>
                                {log.status !== 'ACKNOWLEDGED' && (
                                    <button onClick={() => handleAcknowledge(log.id)} className="flex gap-1 items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-bold">
                                        <CheckCircle2 className="h-4 w-4" /> Terima / Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground border rounded bg-card">
                            Belum ada catatan serah terima.
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Buat Log Handover</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Pabrik</label>
                                    <select className="w-full p-2 border rounded" required value={newLog.id_factory} onChange={e => setNewLog({ ...newLog, id_factory: e.target.value })}>
                                        <option value="">Pilih Pabrik...</option>
                                        {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Shift</label>
                                    <select className="w-full p-2 border rounded" value={newLog.shift} onChange={e => setNewLog({ ...newLog, shift: e.target.value })}>
                                        <option value="SHIFT_1">Shift 1 (Pagi)</option>
                                        <option value="SHIFT_2">Shift 2 (Siang)</option>
                                        <option value="SHIFT_3">Shift 3 (Malam)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Catatan Operasional / Pencapaian <span className="text-red-500">*</span></label>
                                <textarea className="w-full p-2 border rounded min-h-[100px]" required value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} placeholder="Catat aktivitas mesin, stok bahan, kondisi umum pabrik..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Isu / Kendala (Opsional)</label>
                                <textarea className="w-full p-2 border rounded min-h-[60px] text-red-900 bg-red-50/30" value={newLog.issues_reported} onChange={e => setNewLog({ ...newLog, issues_reported: e.target.value })} placeholder="Catat kerusakan alat, keterlambatan material, dll."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded">Simpan & Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
