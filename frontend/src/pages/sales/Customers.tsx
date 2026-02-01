import { useState, useEffect } from 'react';
import { Header } from '../../components/Layout';
import { customerApi } from '../../services/api';

interface Customer {
    id: number;
    code: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    is_active: boolean;
    created_at?: string;
}

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await customerApi.getAll({ limit: 50 });
            setCustomers(res.data.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.is_active).length;
    const newCustomers = customers.filter(c => {
        if (!c.created_at) return false;
        const date = new Date(c.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return (
        <>
            <Header title="Pelanggan" subtitle="Manajemen data pelanggan dan mitra" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Pelanggan</span>
                            <span className="material-symbols-outlined stat-card-icon">group</span>
                        </div>
                        <div className="stat-card-value">{totalCustomers}</div>
                        <span className="badge badge-info">Terdaftar</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Pelanggan Aktif</span>
                            <span className="material-symbols-outlined stat-card-icon">verified_user</span>
                        </div>
                        <div className="stat-card-value text-success">{activeCustomers}</div>
                        <span className="badge badge-success">Active</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Baru Bulan Ini</span>
                            <span className="material-symbols-outlined stat-card-icon">person_add</span>
                        </div>
                        <div className="stat-card-value">{newCustomers}</div>
                        <span className="badge badge-primary">New</span>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Data Pelanggan</h3>
                            <p className="card-subtitle">Daftar semua pelanggan terdaftar</p>
                        </div>
                        <button className="btn btn-primary">
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah Pelanggan
                        </button>
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
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th>Kontak</th>
                                        <th>Telepon</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                                <div className="empty-state">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>group_off</span>
                                                    <p>Belum ada data pelanggan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((c) => (
                                            <tr key={c.id}>
                                                <td className="font-mono">{c.code}</td>
                                                <td style={{ fontWeight: 500 }}>{c.name}</td>
                                                <td>{c.contact_person}</td>
                                                <td>{c.phone}</td>
                                                <td>{c.email}</td>
                                                <td>
                                                    <span className={`badge ${c.is_active ? 'badge-success' : 'badge-error'}`}>
                                                        {c.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm">
                                                            <span className="material-symbols-outlined icon-sm">edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                                                            <span className="material-symbols-outlined icon-sm">delete</span>
                                                        </button>
                                                    </div>
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

export default Customers;
