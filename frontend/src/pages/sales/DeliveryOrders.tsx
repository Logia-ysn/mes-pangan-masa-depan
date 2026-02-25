import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryOrderApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';
import Pagination from '../../components/UI/Pagination';
import { formatDate } from '../../utils/formatUtils';

interface DeliveryOrder {
    id: number;
    id_invoice: number;
    do_number: string;
    delivery_date: string;
    driver_name?: string;
    vehicle_number?: string;
    status: 'PENDING' | 'ON_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    Invoice?: {
        invoice_number: string;
        Customer?: { id: number; name: string; code: string };
    };
}

const statusConfig: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'Menunggu', class: 'badge-info' },
    ON_DELIVERY: { label: 'Di Perjalanan', class: 'badge-warning' },
    DELIVERED: { label: 'Terkirim', class: 'badge-success' },
    CANCELLED: { label: 'Dibatalkan', class: 'badge-error' }
};

const DeliveryOrders = () => {
    const navigate = useNavigate();
    const { showError } = useToast();
    const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchDeliveryOrders();
    }, [page]);

    const fetchDeliveryOrders = async () => {
        try {
            setLoading(true);
            const response = await deliveryOrderApi.getAll({
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            });
            const data = response.data?.data || response.data || [];
            const total = response.data?.total || data.length;

            setDeliveryOrders(Array.isArray(data) ? data : []);
            setTotalItems(total);
        } catch (error) {
            logger.error('Error fetching delivery orders:', error);
            showError('Error', 'Gagal memuat data surat jalan');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="page-content">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Daftar Surat Jalan (DO)</h3>
                        <p className="card-subtitle">Kelola pengiriman barang ke pelanggan</p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined animate-pulse">local_shipping</span>
                        </div>
                        <h3>Memuat data...</h3>
                    </div>
                ) : deliveryOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                        <h3>Belum ada surat jalan</h3>
                        <p>Surat jalan dapat dibuat dari halaman Detail Invoice.</p>
                        <button className="btn btn-primary mt-4" onClick={() => navigate('/sales/invoices')}>
                            <span className="material-symbols-outlined icon-sm">receipt_long</span>
                            Lihat Invoice
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>No. DO</th>
                                        <th className="hide-mobile">Tanggal Kirim</th>
                                        <th>No. Invoice</th>
                                        <th>Customer</th>
                                        <th className="hide-mobile">Kendaraan</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryOrders.map((doRecord) => {
                                        const status = statusConfig[doRecord.status] || statusConfig.PENDING;
                                        return (
                                            <tr key={doRecord.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/invoices/${doRecord.id_invoice}`)}>
                                                <td>
                                                    <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                        {doRecord.do_number}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile">{formatDate(doRecord.delivery_date)}</td>
                                                <td>
                                                    <span className="font-mono text-sm">{doRecord.Invoice?.invoice_number || '-'}</span>
                                                </td>
                                                <td>{doRecord.Invoice?.Customer?.name || '-'}</td>
                                                <td className="hide-mobile">
                                                    {doRecord.vehicle_number ? (
                                                        <span className="badge badge-secondary">{doRecord.vehicle_number}</span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/sales/invoices/${doRecord.id_invoice}`); }}>
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

export default DeliveryOrders;
