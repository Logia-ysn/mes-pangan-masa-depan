import { useState } from 'react';
import { Search, ArrowRight, ArrowLeft, Package, Calendar, Database, FileText } from 'lucide-react';
import { genealogyApi } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface GenealogyData {
    batch_code: string;
    type: string;
    product_name?: string;
    quantity?: number;
    date?: string;
    details?: any;
    children: GenealogyData[];
}

// Avoid loop detection string
export default function BatchGenealogy() {
    const [searchInput, setSearchInput] = useState('');
    const [treeData, setTreeData] = useState<GenealogyData | null>(null);
    const [viewMode, setViewMode] = useState<'FORWARD' | 'BACKWARD'>('BACKWARD');
    const [loading, setLoading] = useState(false);

    const fetchTrace = async (direction: 'FORWARD' | 'BACKWARD') => {
        if (!searchInput) return;
        setLoading(true);
        setViewMode(direction);
        setTreeData(null);
        try {
            const data = direction === 'FORWARD'
                ? await genealogyApi.traceForward(searchInput)
                : await genealogyApi.traceBackward(searchInput);

            if (!data || data.type === 'UNKNOWN') {
                toast.error('Data silsilah tidak ditemukan untuk batch tersebut');
            } else {
                setTreeData(data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Gagal memuat genealogy');
        } finally {
            setLoading(false);
        }
    };

    const renderNode = (node: GenealogyData, isRoot = false) => {
        return (
            <div className={`mt-4 ${!isRoot ? 'ml-8 relative' : ''}`}>
                {!isRoot && (
                    <div className="absolute -left-6 top-6 bottom-0 w-4 border-l-2 border-b-2 border-border rounded-bl" />
                )}
                <div className={`p-4 border rounded-lg bg-card shadow-sm z-10 relative ${isRoot ? 'ring-2 ring-primary' : ''}`}>
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold text-lg">{node.batch_code}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted whitespace-nowrap">{node.type}</span>
                        </div>
                        {node.quantity && (
                            <div className="font-semibold">{Number(node.quantity).toLocaleString('id-ID')} kg</div>
                        )}
                    </div>

                    <div className="mt-2 text-sm">
                        {node.product_name && (
                            <div className="flex items-center gap-1.5 text-primary font-medium">
                                <Package className="h-4 w-4" /> {node.product_name}
                            </div>
                        )}
                        {node.date && (
                            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(node.date), 'dd MMM yyyy HH:mm')}
                            </div>
                        )}
                    </div>

                    {node.details && Object.keys(node.details).length > 0 && (
                        <div className="mt-3 bg-muted/30 p-2 rounded grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {node.details.factory && <div>Factory: {node.details.factory}</div>}
                            {node.details.shift && <div>Shift: {node.details.shift}</div>}
                            {node.details.worksheet_id && (
                                <div className="flex gap-1 items-center">
                                    <FileText className="h-3 w-3" /> WO/WS ID: {node.details.worksheet_id}
                                </div>
                            )}
                            {node.details.invoice_id && <div>Invoice: {node.details.invoice_id}</div>}
                        </div>
                    )}
                </div>

                {node.children && node.children.length > 0 && (
                    <div className="ml-4 border-l-2 border-border">
                        {node.children.map((child, idx) => (
                            <div key={idx}>{renderNode(child, false)}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Batch Genealogy</h1>
                    <p className="text-muted-foreground">Telusuri asal-usul produksi (Traceability)</p>
                </div>
            </div>

            <div className="p-6 bg-card border rounded-lg shadow-sm">
                <div className="flex max-w-2xl mx-auto gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            className="pl-9 pr-4 py-2 w-full border rounded-md"
                            placeholder="Masukkan Kode Batch..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => fetchTrace('BACKWARD')}
                        disabled={loading || !searchInput}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md flex items-center gap-2 hover:bg-secondary/80 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" /> Trace Backward
                    </button>

                    <button
                        onClick={() => fetchTrace('FORWARD')}
                        disabled={loading || !searchInput}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                    >
                        Trace Forward <ArrowRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-2 text-center text-xs text-muted-foreground">
                    Backward: Cari asal muasal bahan baku dari sebuah Finish Good Batch. <br />
                    Forward: Cari ke mana gabah/bahan baku digunakan.
                </div>
            </div>

            {loading && (
                <div className="py-20 text-center animate-pulse text-muted-foreground">
                    Menganalisis pohon silsilah...
                </div>
            )}

            {!loading && treeData && (
                <div className="max-w-4xl mx-auto pb-10">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        Hasil Penelusuran {viewMode === 'FORWARD' ? 'Maju' : 'Mundur'}
                    </h3>
                    {renderNode(treeData, true)}
                </div>
            )}
        </div>
    );
}
