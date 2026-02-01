import { useState, useEffect } from 'react';
import { Header } from '../../components/Layout';
import { invoiceApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    total: number;
    status: string;
}

const Invoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await invoiceApi.getAll({ limit: 50 });
            setInvoices(res.data.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const data = invoices.map(i => ({
            'Invoice Number': i.invoice_number,
            'Date': new Date(i.invoice_date).toLocaleDateString('id-ID'),
            'Due Date': new Date(i.due_date).toLocaleDateString('id-ID'),
            'Total': i.total,
            'Status': i.status
        }));
        exportToCSV(data, `Invoices_${new Date().toISOString().split('T')[0]}`);
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const getStatusBadge = (status: string) => {
        const map: { [key: string]: string } = {
            'DRAFT': 'badge-info',
            'SENT': 'badge-warning',
            'PAID': 'badge-success',
            'PARTIAL': 'badge-warning',
            'OVERDUE': 'badge-error',
            'CANCELLED': 'badge-error',
        };
        return map[status] || 'badge-info';
    };

    // Stats
    const totalRevenue = invoices
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + Number(i.total), 0);

    const pendingAmount = invoices
        .filter(i => ['SENT', 'PARTIAL'].includes(i.status))
        .reduce((sum, i) => sum + Number(i.total), 0);

    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;

    return (
        <>
            <Header title="Invoice" subtitle="Kelola tagihan dan pembayaran pelanggan" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Pendapatan</span>
                            <span className="material-symbols-outlined stat-card-icon">payments</span>
                        </div>
                        <div className="stat-card-value text-success">{formatCurrency(totalRevenue)}</div>
                        <span className="badge badge-success">Paid</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Menunggu Pembayaran</span>
                            <span className="material-symbols-outlined stat-card-icon">pending_actions</span>
                        </div>
                        <div className="stat-card-value text-warning">{formatCurrency(pendingAmount)}</div>
                        <span className="badge badge-warning">Pending</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Jatuh Tempo</span>
                            <span className="material-symbols-outlined stat-card-icon">assignment_late</span>
                        </div>
                        <div className="stat-card-value text-error">{overdueCount}</div>
                        <span className="badge badge-error">Overdue</span>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Daftar Invoice</h3>
                            <p className="card-subtitle">Riwayat tagihan pelanggan</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={handleExport}>
                                <span className="material-symbols-outlined icon-sm">download</span>
                                Export
                            </button>
                            <button className="btn btn-primary">
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Buat Invoice
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                            </div>
                            <h3>Memuat data...</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>No. Invoice</th>
                                        <th>Tanggal</th>
                                        <th>Jatuh Tempo</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                                <div className="empty-state">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>receipt_long</span>
                                                    <p>Belum ada invoice</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td style={{ fontWeight: 500 }} className="font-mono">{inv.invoice_number}</td>
                                                <td>{formatDate(inv.invoice_date)}</td>
                                                <td>{formatDate(inv.due_date)}</td>
                                                <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                                                <td>
                                                    <span className={`badge ${getStatusBadge(inv.status)}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-ghost btn-sm">
                                                        <span className="material-symbols-outlined icon-sm">visibility</span>
                                                    </button>
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
        </>
    );
};

export default Invoices;
