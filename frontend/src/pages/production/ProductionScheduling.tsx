import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, PlayCircle, CheckCircle2 } from 'lucide-react';
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

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/work-orders');
            const data = res.data?.data || res.data || [];
            setWorkOrders(Array.isArray(data) ? data : []);
        } catch (err: any) {
            toast.error('Gagal mengambil data jadwal produksi');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DRAFT':
            case 'PLANNED': return <Calendar className="h-4 w-4 text-slate-500" />;
            case 'IN_PROGRESS': return <PlayCircle className="h-4 w-4 text-blue-500" />;
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'CANCELLED': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-slate-500" />;
        }
    };

    const renderWOColumn = (title: string, statusFilter: string[]) => {
        const filtered = workOrders.filter(wo => statusFilter.includes(wo.status));
        return (
            <div className="flex flex-col bg-muted/30 border rounded-lg overflow-hidden">
                <div className="p-3 bg-muted font-bold text-sm flex justify-between items-center border-b">
                    {title}
                    <span className="bg-background px-2 py-0.5 rounded-full text-xs">{filtered.length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {filtered.map(wo => (
                        <div key={wo.id} className="p-3 bg-card border rounded shadow-sm cursor-grab hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-sm">{wo.wo_number}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getPriorityColor(wo.priority)}`}>
                                    {wo.priority}
                                </span>
                            </div>
                            <div className="text-sm text-primary font-medium mb-3 line-clamp-1">
                                {wo.ProductType?.name || 'Produk Tidak Diketahui'}
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    {getStatusIcon(wo.status)} {wo.status}
                                </div>
                                <div className="font-medium">
                                    {Number(wo.target_quantity).toLocaleString('id-ID')} kg
                                </div>
                            </div>
                            {wo.start_date && (
                                <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex justify-between">
                                    <span>Mulai: {format(parseISO(wo.start_date), 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Production Scheduling</h1>
                    <p className="text-muted-foreground">Kanban board untuk memantau jadwal eksekusi Work Order</p>
                </div>
                <button onClick={fetchWorkOrders} className="px-4 py-2 border rounded-md hover:bg-muted text-sm">
                    Refresh Board
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Memuat board jadwal...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-hidden">
                    {renderWOColumn('Planned / To Do', ['DRAFT', 'PLANNED'])}
                    {renderWOColumn('In Progress', ['IN_PROGRESS'])}
                    {renderWOColumn('Completed', ['COMPLETED'])}
                    {renderWOColumn('Cancelled / Hold', ['CANCELLED', 'ON_HOLD'])}
                </div>
            )}
        </div>
    );
}
