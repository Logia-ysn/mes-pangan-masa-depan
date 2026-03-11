import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, PlayCircle, CheckCircle2, Search, MoreHorizontal, FileText } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface WorkOrder {
    id: number;
    wo_number: string;
    status: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    target_quantity: number;
    start_date: string;
    end_date?: string;
    ProductType?: { name: string };
}

export default function ProductionScheduling() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        setLoading(true);
        try {
            // Using standard api import based on previous file
            const res = await api.get('/work-orders');
            const data = res.data?.data || res.data || [];
            setWorkOrders(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error('Gagal mengambil data jadwal produksi');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const styles = {
            URGENT: 'bg-red-500/10 text-red-600 border-red-500/20',
            HIGH: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
            MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            LOW: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        }[priority] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

        return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wider ${styles}`}>{priority}</span>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DRAFT': return <FileText className="h-3.5 w-3.5 text-slate-400" />;
            case 'PLANNED': return <Calendar className="h-3.5 w-3.5 text-blue-500" />;
            case 'IN_PROGRESS': return <PlayCircle className="h-3.5 w-3.5 text-orange-500 animate-pulse" />;
            case 'COMPLETED': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
            case 'CANCELLED': return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
            default: return <Clock className="h-3.5 w-3.5 text-slate-400" />;
        }
    };

    const renderWOColumn = (title: string, statusFilter: string[], dotColor: string) => {
        const filtered = workOrders
            .filter(wo => statusFilter.includes(wo.status))
            .filter(wo =>
                wo.wo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (wo.ProductType?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

        return (
            <div className="flex flex-col bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl overflow-hidden shadow-sm h-full">
                <div className="p-4 bg-white/80 border-b flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                        <h3 className="font-semibold text-sm text-slate-800 tracking-tight">{title}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border">
                        {filtered.length}
                    </span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                    {filtered.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-400 p-4 border-2 border-dashed border-slate-200 rounded-lg">
                            <Clock className="h-6 w-6 mb-2 opacity-50" />
                            <span className="text-xs font-medium text-center">Tidak ada tiket di antrean ini</span>
                        </div>
                    ) : (
                        filtered.map(wo => (
                            <div key={wo.id} className="group p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-sm text-slate-800">{wo.wo_number}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </div>

                                <h4 className="text-sm font-semibold text-slate-700 leading-snug mb-3 line-clamp-2">
                                    {wo.ProductType?.name || 'Produk Tidak Diketahui'}
                                </h4>

                                <div className="flex items-center gap-3 mb-4">
                                    {getPriorityBadge(wo.priority)}
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-100">
                                        {getStatusIcon(wo.status)}
                                        <span className="capitalize">{wo.status.toLowerCase().replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-auto">
                                    <div className="text-xs font-medium text-slate-500">
                                        {wo.start_date ? format(parseISO(wo.start_date), 'dd MMM yyyy') : '-'}
                                    </div>
                                    <div className="font-bold text-sm text-slate-800 bg-slate-50 px-2 py-1 rounded-md">
                                        {Number(wo.target_quantity).toLocaleString('id-ID')} <span className="text-xs font-medium text-slate-500">kg</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="page-content h-full flex flex-col overflow-hidden">
            <div className="page-header" style={{ marginBottom: 24, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(19, 127, 236, 0.2)'
                    }}>
                        <Calendar className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Production Scheduling</h1>
                        <p className="page-subtitle">Pusat kontrol penjadwalan Work Order (Kanban)</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', width: 280 }}>
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari WO atau produk..."
                            style={{
                                width: '100%', paddingLeft: 40, height: 44,
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                borderRadius: 12, fontSize: 14, outline: 'none'
                            }}
                            className="focus:border-primary transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchWorkOrders}
                        className="btn btn-primary"
                        style={{ height: 44, padding: '0 20px', borderRadius: 12 }}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Refresh Board
                    </button>
                </div>
            </div>

            {/* Board Area */}
            {loading ? (
                <div className="flex-1 glass-card flex items-center justify-center m-1">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="font-bold text-slate-400 tracking-widest text-xs uppercase">Initializing Production Board</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 min-h-0 pb-4 overflow-x-auto">
                    {renderWOColumn('Scheduled (To Do)', ['DRAFT', 'PLANNED'], 'bg-blue-500')}
                    {renderWOColumn('In Progress', ['IN_PROGRESS'], 'bg-amber-500')}
                    {renderWOColumn('Completed', ['COMPLETED'], 'bg-emerald-500')}
                    {renderWOColumn('Hold / Cancelled', ['CANCELLED', 'ON_HOLD'], 'bg-rose-500')}
                </div>
            )}
        </div>
    );
}
