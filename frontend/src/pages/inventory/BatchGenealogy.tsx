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
            <div className={`mt-6 ${!isRoot ? 'ml-10 relative' : ''}`}>
                {!isRoot && (
                    <div style={{
                        position: 'absolute', left: '-24px', top: '24px', bottom: 0, width: '24px',
                        borderLeft: '2px dashed rgba(255, 255, 255, 0.1)',
                        borderBottom: '2px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '0 0 0 12px'
                    }} />
                )}
                <div className={`glass-card relative z-10 transition-all hover:scale-[1.01] ${isRoot ? 'border-primary shadow-lg shadow-primary/20' : ''}`} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'
                            }}>
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{node.batch_code}</div>
                                <span style={{
                                    padding: '2px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6,
                                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px'
                                }}>{node.type}</span>
                            </div>
                        </div>
                        {node.quantity && (
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{Number(node.quantity).toLocaleString('id-ID')}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>KILOGRAM (KG)</div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {node.product_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Package className="h-4 w-4 text-primary" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.product_name}</span>
                            </div>
                        )}
                        {node.date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(node.date), 'dd MMM yyyy HH:mm')}</span>
                            </div>
                        )}
                    </div>

                    {node.details && Object.keys(node.details).length > 0 && (
                        <div style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.02)',
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            {node.details.factory && (
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Factory</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{node.details.factory}</div>
                                </div>
                            )}
                            {node.details.shift && (
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shift</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{node.details.shift}</div>
                                </div>
                            )}
                            {node.details.worksheet_id && (
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Process ID</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FileText className="h-3 w-3" /> {node.details.worksheet_id}
                                    </div>
                                </div>
                            )}
                            {node.details.invoice_id && (
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{node.details.invoice_id}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {node.children && node.children.length > 0 && (
                    <div style={{ borderLeft: '2px solid rgba(255, 255, 255, 0.05)', marginLeft: 16 }}>
                        {node.children.map((child, idx) => (
                            <div key={idx}>{renderNode(child, false)}</div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', boxShadow: '0 8px 16px rgba(19, 127, 236, 0.2)'
                    }}>
                        <Search className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Batch Genealogy</h1>
                        <p className="page-subtitle">Telusuri asal-usul produksi dan rantai pasokan (End-to-End Traceability)</p>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ position: 'relative', display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                style={{ paddingLeft: 48, height: 56, fontSize: 16, background: 'var(--bg-surface)', border: 'none' }}
                                placeholder="Masukkan Kode Batch Produksi / Material..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => fetchTrace('BACKWARD')}
                            disabled={loading || !searchInput}
                            className="btn btn-secondary"
                            style={{ height: 56, padding: '0 24px' }}
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" /> Backward Trace
                        </button>

                        <button
                            onClick={() => fetchTrace('FORWARD')}
                            disabled={loading || !searchInput}
                            className="btn btn-primary"
                            style={{ height: 56, padding: '0 24px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', border: 'none' }}
                        >
                            Forward Trace <ArrowRight className="h-5 w-5 ml-2" />
                        </button>
                    </div>

                    <div style={{
                        marginTop: 20, padding: '12px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.02)', fontSize: 12,
                        color: 'var(--text-muted)', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <strong style={{ color: 'var(--primary)' }}>TIPS:</strong> Backward mencari asal muasal bahan baku. Forward mencari ke pemakaian produk akhir.
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>Menganalisis Silsilah Batch</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Silakan tunggu sebentar, sistem sedang memetakan hubungan antar batch...</p>
                </div>
            )}

            {!loading && treeData && (
                <div style={{ maxWidth: '900px', margin: '40px auto 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 8px' }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                            Peta Silsilah {viewMode === 'FORWARD' ? 'Maju (Downstream)' : 'Mundur (Upstream)'}
                        </h3>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', opacity: 0.6 }}>ROOT NODE: {treeData.batch_code}</span>
                    </div>
                    {renderNode(treeData, true)}
                </div>
            )}
        </div>
    );
}
