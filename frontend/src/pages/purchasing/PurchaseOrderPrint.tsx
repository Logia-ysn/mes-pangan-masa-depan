import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { logger } from '../../utils/logger';

interface PurchaseOrder {
    id: number;
    po_number: string;
    order_date: string;
    valid_until?: string | null;
    status: string;
    notes?: string;
    pricing_type?: string;
    pricing_data?: {
        grid: Array<{
            moisture: number;
            kw1: number;
            kw2: number;
            kw3: number;
        }>;
    };
    Supplier?: { name: string; code: string; address?: string; phone?: string };
    Variety?: { name: string; code: string };
    PurchaseOrderItem: Array<{
        ProductType: { name: string; unit: string };
        quantity: number;
        unit_price: number;
    }>;
}

const PurchaseOrderPrint = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchPO(parseInt(id));
    }, [id]);

    const fetchPO = async (poId: number) => {
        try {
            const response = await purchaseOrderApi.getById(poId);
            setPo(response.data);
            // Auto trigger print after loading data
            setTimeout(() => {
                window.print();
            }, 1000);
        } catch (error) {
            logger.error('Error fetching PO for print:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat data...</div>;
    if (!po) return <div className="p-8 text-center text-error">Purchase Order tidak ditemukan</div>;

    const isPlafon = po.pricing_type === 'PLAFON';

    return (
        <div className="print-container">
            <style>
                {`
                @media print {
                    @page { margin: 1cm; }
                    body { background: white; color: black; }
                    .no-print { display: none !important; }
                    .print-container { padding: 0; max-width: 100%; border: none; box-shadow: none; }
                }
                .print-container {
                    background: white;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: 'Inter', sans-serif;
                    color: #1a202c;
                    line-height: 1.5;
                }
                .header-line { border-bottom: 2px solid #2d3748; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 5px; text-transform: uppercase; }
                .po-num { text-align: center; font-family: monospace; font-size: 16px; margin-bottom: 30px; color: #4a5568; }
                .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                .info-label { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; }
                .info-value { font-size: 15px; font-weight: 600; margin-top: 2px; }
                .table-print { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; }
                .table-print th { background: #f7fafc; padding: 10px; border: 1px solid #cbd5e0; text-align: left; font-size: 13px; }
                .table-print td { padding: 10px; border: 1px solid #cbd5e0; font-size: 14px; }
                .table-print .text-right { text-align: right; }
                .table-print .text-center { text-align: center; }
                .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; margin-top: 60px; }
                .signature-box { height: 80px; }
                .signature-name { font-weight: 700; text-decoration: underline; margin-bottom: 2px; }
                .signature-title { font-size: 12px; color: #4a5568; }
                `}
            </style>

            <div className="no-print" style={{ position: 'fixed', top: 20, right: 20, display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Kembali</button>
                <button className="btn btn-primary" onClick={() => window.print()}>Cetak</button>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: '#2d3748' }}>PANGAN MASA DEPAN</h1>
                    <p style={{ fontSize: 12, color: '#4a5568' }}>Solusi Pangan Terintegrasi</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>TANGGAL CETAK</div>
                    <div style={{ fontSize: 14 }}>{formatDate(new Date())}</div>
                </div>
            </div>
            <div className="header-line"></div>

            <div className="title">{isPlafon ? 'PLAFON PADI' : 'PURCHASE ORDER'}</div>
            <div className="po-num">NO: {po.po_number}</div>

            <div className="grid-info">
                <div>
                    <div className="info-label">Supplier / Rekanan</div>
                    <div className="info-value">{po.Supplier?.name || 'UMUM'}</div>
                    <div style={{ fontSize: 13, color: '#4a5568' }}>{po.Supplier?.address}</div>
                </div>
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                            <div className="info-label">Berlaku Dari</div>
                            <div className="info-value">{formatDate(po.order_date)}</div>
                        </div>
                        <div>
                            <div className="info-label">{isPlafon ? 'Sampai' : 'Estimasi'}</div>
                            <div className="info-value">{formatDate(po.valid_until || po.order_date)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {isPlafon && (
                <div style={{ marginBottom: 30 }}>
                    <div className="info-label" style={{ marginBottom: 5 }}>Jenis Gabah</div>
                    <div className="info-value" style={{ fontSize: 18, color: '#2b6cb0' }}>{po.Variety?.name || 'Semua Jenis'}</div>
                </div>
            )}

            {isPlafon && po.pricing_data?.grid ? (
                <div>
                    <div className="info-label" style={{ marginBottom: 10 }}>Daftar Harga Beli (KA %)</div>
                    <table className="table-print">
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: 80 }}>% KA</th>
                                <th className="text-center">HARGA KW 1</th>
                                <th className="text-center">HARGA KW 2</th>
                                <th className="text-center">HARGA KW 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.pricing_data.grid.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="text-center" style={{ fontWeight: 700 }}>
                                        {row.moisture === 14 ? '≤ 14' : row.moisture} %
                                    </td>
                                    <td className="text-center" style={{ fontFamily: 'monospace', fontSize: 15 }}>{formatCurrency(row.kw1)}</td>
                                    <td className="text-center" style={{ fontFamily: 'monospace', fontSize: 15 }}>{formatCurrency(row.kw2)}</td>
                                    <td className="text-center" style={{ fontFamily: 'monospace', fontSize: 15 }}>{formatCurrency(row.kw3)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <table className="table-print">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Harga</th>
                            <th className="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {po.PurchaseOrderItem.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.ProductType.name}</td>
                                <td className="text-right">{item.quantity} {item.ProductType.unit}</td>
                                <td className="text-right">{formatCurrency(item.unit_price)}</td>
                                <td className="text-right">{formatCurrency(item.quantity * item.unit_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {po.notes && (
                <div style={{ marginBottom: 30 }}>
                    <div className="info-label">Catatan Tambahan</div>
                    <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 5 }}>"{po.notes}"</div>
                </div>
            )}

            <div className="footer-grid">
                <div>
                    <div className="signature-title">Dibuat Oleh,</div>
                    <div className="signature-box"></div>
                    <div className="signature-name">OPERATOR CABANG</div>
                    <div className="signature-title">PT. PANGAN MASA DEPAN</div>
                </div>
                <div>
                    <div className="signature-title">Mengetahui,</div>
                    <div className="signature-box"></div>
                    <div className="signature-name">MANAGER OPERASIONAL</div>
                    <div className="signature-title">PT. PANGAN MASA DEPAN</div>
                </div>
                <div>
                    <div className="signature-title">Diterima Oleh,</div>
                    <div className="signature-box"></div>
                    <div className="signature-name">REKANAN / SUPPLIER</div>
                    <div className="signature-title">Tanda Tangan & Nama Terang</div>
                </div>
            </div>

            <div style={{ marginTop: 40, borderTop: '1px dashed #cbd5e0', paddingTop: 10, fontSize: 10, color: '#a0aec0', textAlign: 'center' }}>
                Dokumen ini digenerate secara otomatis oleh ERP Pangan Masa Depan pada {new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default PurchaseOrderPrint;
