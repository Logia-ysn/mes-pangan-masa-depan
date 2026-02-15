import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { worksheetApi, machineApi, employeeApi } from '../../services/api';
import ProductionProgress from '../../components/Production/ProductionProgress';
import type { ProductionStep } from '../../components/Production/ProductionProgress';
import { printPage } from '../../utils/printUtils';
import { logger } from '../../utils/logger';

interface InputBatch {
    id: number;
    quantity: number;
    unit_price: number;
    total_cost: number;
    otm_id_stock: {
        id: number;
        otm_id_product_type: {
            name: string;
        };
        batch_code?: string;
    };
}

interface Worksheet {
    id: number;
    worksheet_date: string;
    shift: string;
    gabah_input: number;
    beras_output: number;
    menir_output: number;
    dedak_output: number;
    sekam_output: number;
    machine_hours: number;
    downtime_hours: number;
    downtime_reason: string;
    notes: string;
    process_steps?: string;
    // Enhanced fields
    otm_id_machine?: { id: number; name: string };
    otm_id_user?: { id: number; fullname: string; email: string };
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    input_batches?: InputBatch[];
    id_machines?: string;
    id_operators?: string;
}

const WorksheetDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
    const [machines, setMachines] = useState<{ id: number; name: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: number; fullname: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Parse process steps from worksheet
    const getProductionSteps = (): ProductionStep[] => {
        if (!worksheet?.process_steps) return [];

        try {
            const steps = JSON.parse(worksheet.process_steps) as string[];
            return steps.map((step, index) => ({
                id: String(index + 1),
                label: step, // You might want to map codes to readable labels here
                status: 'completed', // Assume all selected steps are part of this completed worksheet
                icon: 'settings_suggest', // Generic icon or map based on step name
                date: formatDate(worksheet.worksheet_date),
            }));
        } catch (e) {
            logger.error('Failed to parse process steps', e);
            return [];
        }
    };

    const productionSteps = getProductionSteps();

    useEffect(() => {
        if (id) {
            fetchWorksheet(parseInt(id));
        }
    }, [id]);

    const fetchWorksheet = async (wsId: number) => {
        try {
            const [wsRes, machRes, empRes] = await Promise.all([
                worksheetApi.getById(wsId),
                machineApi.getAll().catch(() => ({ data: { data: [] } })),
                employeeApi.getAll().catch(() => ({ data: { data: [] } }))
            ]);

            setWorksheet(wsRes.data.data || wsRes.data);
            setMachines(machRes.data?.data || machRes.data || []);
            setEmployees(empRes.data?.data || empRes.data || []);
        } catch (err) {
            logger.error('Error:', err);
            setError('Gagal memuat data worksheet');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/production/worksheets');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);
    const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

    if (loading) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        <h3>Memuat data...</h3>
                    </div>
                </div>
            </>
        );
    }

    if (error || !worksheet) {
        return (
            <>
                <div className="page-content">
                    <div className="empty-state">
                        <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
                        <h3>{error || 'Data tidak ditemukan'}</h3>
                        <button className="btn btn-primary" onClick={handleBack} style={{ marginTop: 16 }}>
                            Kembali ke Daftar
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const rendemen = worksheet.gabah_input > 0
        ? ((worksheet.beras_output / worksheet.gabah_input) * 100).toFixed(2)
        : '0';


    return (
        <>
            <div className="page-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <button className="btn btn-secondary" onClick={handleBack}>
                        <span className="material-symbols-outlined icon-sm">arrow_back</span>
                        Kembali
                    </button>

                    <button className="btn btn-secondary" onClick={printPage}>
                        <span className="material-symbols-outlined icon-sm">print</span>
                        Print
                    </button>
                </div>

                {/* Production Flow Visualization */}
                <ProductionProgress steps={productionSteps} />

                <div className="grid grid-2-1">
                    {/* Main Info */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header">
                            <h3 className="card-title">Informasi Produksi</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div className="badge badge-info">{worksheet.shift}</div>
                                {worksheet.batch_code && <div className="badge badge-success">{worksheet.batch_code}</div>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, padding: 24 }}>
                            <div>
                                <label className="text-secondary text-sm">Tanggal</label>
                                <div className="text-lg font-medium">{formatDate(worksheet.worksheet_date)}</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Mesin / Unit</label>
                                <div className="text-lg font-medium">
                                    {worksheet.id_machines ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                            {(() => {
                                                try {
                                                    const ids = JSON.parse(worksheet.id_machines) as number[];
                                                    if (!Array.isArray(ids) || ids.length === 0) return worksheet.otm_id_machine?.name || '-';
                                                    return ids.map(id => {
                                                        const m = machines.find(m => m.id === id);
                                                        return (
                                                            <span key={id} className="badge badge-secondary" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px' }}>
                                                                {m ? m.name : `Mesin #${id}`}
                                                            </span>
                                                        );
                                                    });
                                                } catch (e) {
                                                    return worksheet.otm_id_machine?.name || '-';
                                                }
                                            })()}
                                        </div>
                                    ) : (
                                        worksheet.otm_id_machine?.name || '-'
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Operator</label>
                                <div className="text-lg font-medium">
                                    {worksheet.id_operators ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                            {(() => {
                                                try {
                                                    const ids = JSON.parse(worksheet.id_operators) as number[];
                                                    if (!Array.isArray(ids) || ids.length === 0) return worksheet.otm_id_user?.fullname || '-';
                                                    return ids.map(id => {
                                                        const emp = employees.find(e => e.id === id);
                                                        return (
                                                            <span key={id} className="badge badge-info" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px' }}>
                                                                {emp ? emp.fullname : `Operator #${id}`}
                                                            </span>
                                                        );
                                                    });
                                                } catch (e) {
                                                    return worksheet.otm_id_user?.fullname || '-';
                                                }
                                            })()}
                                        </div>
                                    ) : (
                                        worksheet.otm_id_user?.fullname || '-'
                                    )}
                                </div>
                            </div>

                            <hr style={{ gridColumn: '1 / -1', borderColor: 'var(--border-color)', margin: 0 }} />

                            <div>
                                <label className="text-secondary text-sm">Input Gabah (kg)</label>
                                <div className="text-xl font-bold font-mono">{formatNumber(worksheet.gabah_input)}</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Output Beras (kg)</label>
                                <div className="text-xl font-bold font-mono text-success">{formatNumber(worksheet.beras_output)}</div>
                            </div>

                            <div>
                                <label className="text-secondary text-sm">Rendemen</label>
                                <div className="text-xl font-bold font-mono text-primary">{rendemen}%</div>
                            </div>
                            <div>
                                <label className="text-secondary text-sm">Jam Mesin</label>
                                <div className="text-lg font-mono">{worksheet.machine_hours} Jam</div>
                            </div>
                        </div>
                    </div>

                    {/* Input Batches */}
                    {worksheet.input_batches && worksheet.input_batches.length > 0 && (
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3 className="card-title">Batch Input Bahan Baku</h3>
                            </div>
                            <div className="table-container" style={{ padding: 0 }}>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th className="text-left">Tipe Produk</th>
                                            <th className="text-left">Kode Batch</th>
                                            <th className="text-right">Qty (Kg)</th>
                                            <th className="hide-mobile text-right">Harga/Kg</th>
                                            <th className="hide-mobile text-right">Total Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {worksheet.input_batches.map((batch, idx) => (
                                            <tr key={idx}>
                                                <td>{batch.otm_id_stock?.otm_id_product_type?.name || '-'}</td>
                                                <td className="font-mono">{batch.otm_id_stock?.batch_code || '-'}</td>
                                                <td className="text-right">{formatNumber(batch.quantity)}</td>
                                                <td className="hide-mobile text-right">{formatCurrency(batch.unit_price)}</td>
                                                <td className="hide-mobile text-right">{formatCurrency(batch.total_cost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Financial Info (NEW) */}
                    {worksheet.hpp !== undefined && (
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3 className="card-title">Analisis Biaya (HPP)</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, padding: 24 }}>
                                <div>
                                    <label className="text-secondary text-sm">Biaya Bahan Baku</label>
                                    <div className="text-lg font-medium font-mono text-error">{formatCurrency(worksheet.raw_material_cost || 0)}</div>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">Pendapatan Sampingan</label>
                                    <div className="text-lg font-medium font-mono text-success">{formatCurrency(worksheet.side_product_revenue || 0)}</div>
                                    <small className="text-secondary">(Dikurangkan)</small>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">Total HPP</label>
                                    <div className="text-xl font-bold font-mono">{formatCurrency(worksheet.hpp || 0)}</div>
                                </div>
                                <div>
                                    <label className="text-secondary text-sm">HPP / Kg</label>
                                    <div className="text-xl font-bold font-mono text-primary">{formatCurrency(worksheet.hpp_per_kg || 0)}</div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Byproducts & Downtime */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header">
                            <h3 className="card-title">Detail Lainnya</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px 16px' }}>
                            {/* Byproducts */}
                            <div>
                                <h4 className="text-sm font-bold mb-2">Hasil Samping</h4>
                                <table style={{ width: '100%' }}>
                                    <tbody>
                                        <tr>
                                            <td className="text-secondary">Menir</td>
                                            <td className="font-mono text-right">{formatNumber(worksheet.menir_output)} kg</td>
                                        </tr>
                                        <tr>
                                            <td className="text-secondary">Dedak</td>
                                            <td className="font-mono text-right">{formatNumber(worksheet.dedak_output)} kg</td>
                                        </tr>
                                        <tr>
                                            <td className="text-secondary">Sekam</td>
                                            <td className="font-mono text-right">{formatNumber(worksheet.sekam_output)} kg</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Downtime */}
                            <div>
                                <h4 className="text-sm font-bold mb-2">Downtime</h4>
                                {(worksheet.downtime_hours > 0 || worksheet.downtime_reason) ? (
                                    <div style={{ padding: 12, border: '1px solid var(--error)', borderRadius: 8, backgroundColor: 'rgba(var(--error-rgb), 0.05)' }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-error font-medium">Terjadi Downtime</span>
                                            <span className="badge badge-error">{worksheet.downtime_hours} Jam</span>
                                        </div>
                                        <p className="text-secondary text-sm">{worksheet.downtime_reason || 'Tidak ada alasan'}</p>
                                    </div>
                                ) : (
                                    <div className="text-secondary italic">Tidak ada downtime</div>
                                )}
                            </div>
                        </div>

                        {worksheet.notes && (
                            <div style={{ padding: '0 16px 16px' }}>
                                <h4 className="text-sm font-bold mb-2">Catatan</h4>
                                <p className="text-secondary">{worksheet.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default WorksheetDetail;
