import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import { customerApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Customer {
    id: number;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    created_at: string;
}

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState<string>('all');

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await customerApi.getAll({ limit: 500 });
            const data = response.data?.data || response.data || [];
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customerApi.update(editingCustomer.id, formData);
            } else {
                await customerApi.create(formData);
            }
            fetchCustomers();
            closeModal();
        } catch (error) {
            logger.error('Error saving customer:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) {
            try {
                await customerApi.delete(id);
                fetchCustomers();
            } catch (error) {
                logger.error('Error deleting customer:', error);
            }
        }
    };

    const openModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                code: customer.code,
                name: customer.name,
                contact_person: customer.contact_person || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            const nextCode = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
            setFormData({
                code: nextCode,
                name: '',
                contact_person: '',
                phone: '',
                email: '',
                address: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c => {
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase());
        const matchActive = filterActive === 'all' ||
            (filterActive === 'active' && c.is_active) ||
            (filterActive === 'inactive' && !c.is_active);
        return matchSearch && matchActive;
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.is_active).length;
    const now = new Date();
    const thisMonth = customers.filter(c => {
        const created = new Date(c.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    return (
        <>
            <Header title="Pelanggan" subtitle="Kelola data pelanggan" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Pelanggan</span>
                            <span className="material-symbols-outlined stat-card-icon">groups</span>
                        </div>
                        <div className="stat-card-value">{totalCustomers}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Pelanggan Aktif</span>
                            <span className="material-symbols-outlined stat-card-icon">check_circle</span>
                        </div>
                        <div className="stat-card-value">{activeCustomers}</div>
                        <span className="badge badge-success">
                            {totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}%
                        </span>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Baru Bulan Ini</span>
                            <span className="material-symbols-outlined stat-card-icon">person_add</span>
                        </div>
                        <div className="stat-card-value">{thisMonth}</div>
                    </div>
                </div>

                {/* Customer List */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Daftar Pelanggan</h3>
                            <p className="card-subtitle">Kelola data pelanggan perusahaan</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah Pelanggan
                        </button>
                    </div>

                    {/* Filters */}
                    <div style={{ padding: '0 24px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1, maxWidth: 320 }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Cari nama atau kode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['all', 'active', 'inactive'].map(f => (
                                <button
                                    key={f}
                                    className={`btn btn-sm ${filterActive === f ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilterActive(f)}
                                >
                                    {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                            </div>
                            <h3>Memuat data...</h3>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <h3>Belum ada pelanggan</h3>
                            <p>Klik tombol "Tambah Pelanggan" untuk menambahkan pelanggan baru</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Kode</th>
                                        <th>Nama</th>
                                        <th className="hide-mobile">Kontak</th>
                                        <th>Telepon</th>
                                        <th className="hide-mobile">Email</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                    {customer.code}
                                                </span>
                                            </td>
                                            <td>{customer.name}</td>
                                            <td className="hide-mobile">{customer.contact_person || '-'}</td>
                                            <td>{customer.phone || '-'}</td>
                                            <td className="hide-mobile">{customer.email || '-'}</td>
                                            <td>
                                                <span className={`badge ${customer.is_active ? 'badge-success' : 'badge-error'}`}>
                                                    {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openModal(customer)}>
                                                        <span className="material-symbols-outlined icon-sm">edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(customer.id)}>
                                                        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                                    person
                                </span>
                                <h3 className="modal-title">
                                    {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                                </h3>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Kode <span style={{ color: 'var(--error)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="CUST-001"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Nama <span style={{ color: 'var(--error)' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nama pelanggan"
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Kontak Person</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.contact_person}
                                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                            placeholder="Nama kontak"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telepon</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Alamat</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Alamat lengkap"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Customers;
