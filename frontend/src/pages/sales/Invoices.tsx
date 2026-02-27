import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import { useFactory } from '../../hooks/useFactory';
import Pagination from '../../components/UI/Pagination';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'CANCELLED';
    notes?: string;
    id_factory: number;
    id_customer: number;
    Customer?: { id: number; name: string; code: string };
    Factory?: { id: number; name: string };
}

const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: 'Draft', class: 'badge-info' },
    SENT: { label: 'Terkirim', class: 'badge-warning' },
    PAID: { label: 'Lunas', class: 'badge-success' },
    PARTIAL: { label: 'Sebagian', class: 'badge-warning' },
    CANCELLED: { label: 'Dibatalkan', class: 'badge-error' }
};

const Invoices = () => {
    const navigate = useNavigate();
    const { showError } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Factory hook
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const {
        selectedFactory,
        setSelectedFactory,
        factories,
        loading: factoryLoading
    } = useFactory();

    useEffect(() => {
        if (!factoryLoading) {
            fetchInvoices();
        }
    }, [selectedFactory, page, factoryLoading]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoiceApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
                id_factory: selectedFactory || undefined
            });
            const data = response.data?.data || response.data || [];
            const total = response.data?.total || (Array.isArray(data) ? data.length : 0);

            setInvoices(Array.isArray(data) ? data : []);
            setTotalItems(total);
        } catch (error) {
            logger.error('Error fetching invoices:', error);
            showError('Error', 'Gagal memuat data invoice');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0);
    const pendingAmount = invoices.filter(i => ['DRAFT', 'SENT', 'PARTIAL'].includes(i.status)).reduce((sum, i) => sum + Number(i.total), 0);
    const totalInvoicesCount = totalItems;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            {/* Factory Toggle */}
            <div className="factory-selector-scroll">
                <button
                    className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setSelectedFactory(null); setPage(1); }}
                >
                    <span className="material-symbols-outlined icon-sm">apps</span>
                    Semua
                </button>
                {factories.map(factory => (
                    <button
                        key={factory.id}
                        className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setSelectedFactory(factory.id); setPage(1); }}
                    >
                        <span className="material-symbols-outlined icon-sm">factory</span>
                        {factory.name}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Total Revenue (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">payments</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(totalRevenue)}</div>
                    <span className="badge badge-success">Lunas</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Belum Dibayar (Page)</span>
                        <span className="material-symbols-outlined stat-card-icon">pending</span>
                    </div>
                    <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(pendingAmount)}</div>
                    <span className="badge badge-warning">Outstanding</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-label">Jumlah Invoice</span>
                        <span className="material-symbols-outlined stat-card-icon">receipt_long</span>
                    </div>
                    <div className="stat-card-value">{new Intl.NumberFormat('id-ID').format(totalInvoicesCount)}</div>
                </div>
            </div>

            {/* Invoice List */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Daftar Invoice</h3>
                        <p className="card-subtitle">Kelola invoice penjualan</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/sales/invoices/new')}>
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Buat Invoice
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <h3>Belum ada invoice</h3>
                        <p>Klik tombol "Buat Invoice" untuk membuat invoice baru</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>No. Invoice</th>
                                        <th className="hide-mobile">Tanggal</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((invoice) => {
                                        const status = statusConfig[invoice.status] || statusConfig.DRAFT;
                                        return (
                                            <tr key={invoice.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/invoices/${invoice.id}`)}>
                                                <td>
                                                    <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                        {invoice.invoice_number}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile">{formatDate(invoice.invoice_date)}</td>
                                                <td>{invoice.Customer?.name || '-'}</td>
                                                <td>
                                                    <span className="font-mono">{formatCurrency(invoice.total)}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/sales/invoices/${invoice.id}`)}>
                                                            <span className="material-symbols-outlined icon-sm">visibility</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={totalItems}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Invoices;
