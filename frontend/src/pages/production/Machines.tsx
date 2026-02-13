import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import api, { factoryApi, supplierApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface Machine {
    id: number;
    id_factory: number;
    code: string;
    name: string;
    machine_type: string;
    serial_number?: string;
    manufacture_year?: number;
    capacity_per_hour: number;
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    purchase_date?: string;
    vendor_id?: number;
    purchase_price?: number;
    warranty_months?: number;
    last_maintenance_date?: string;
    next_maintenance_date?: string;
    otm_id_factory?: {
        id: number;
        name: string;
    };
}

interface Factory {
    id: number;
    code: string;
    name: string;
}

interface Supplier {
    id: number;
    code: string;
    name: string;
}

const statusConfig = {
    ACTIVE: { label: 'Aktif', class: 'badge-success', icon: 'check_circle' },
    MAINTENANCE: { label: 'Maintenance', class: 'badge-warning', icon: 'build' },
    INACTIVE: { label: 'Tidak Aktif', class: 'badge-error', icon: 'cancel' }
};

const Machines = () => {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [selectedFactory, setSelectedFactory] = useState<number>(1);

    const [formData, setFormData] = useState({
        id_factory: 1,
        code: '',
        name: '',
        machine_type: '',
        serial_number: '',
        manufacture_year: '',
        capacity_per_hour: '',
        status: 'ACTIVE',
        purchase_date: '',
        vendor_id: '',
        purchase_price: '',
        warranty_months: '12'
    });

    useEffect(() => {
        fetchMachines();
        fetchFactories();
        fetchSuppliers();
    }, []);

    const fetchMachines = async () => {
        try {
            const response = await api.get('/machines');
            const machinesData = response.data?.data || response.data || [];
            setMachines(Array.isArray(machinesData) ? machinesData : []);
        } catch (error) {
            logger.error('Error fetching machines:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFactories = async () => {
        try {
            const response = await factoryApi.getAll();
            const factoriesData = response.data?.data || response.data || [];
            setFactories(Array.isArray(factoriesData) ? factoriesData : []);
            if (factoriesData.length > 0) {
                setSelectedFactory(factoriesData[0].id);
            }
        } catch (error) {
            logger.error('Error fetching factories:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierApi.getAll();
            const suppliersData = response.data?.data || response.data || [];
            setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        } catch (error) {
            logger.error('Error fetching suppliers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                id_factory: formData.id_factory,
                code: formData.code,
                name: formData.name,
                machine_type: formData.machine_type,
                serial_number: formData.serial_number || undefined,
                manufacture_year: formData.manufacture_year ? parseInt(formData.manufacture_year) : undefined,
                capacity_per_hour: parseFloat(formData.capacity_per_hour) || 0,
                status: formData.status,
                purchase_date: formData.purchase_date || undefined,
                vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : undefined,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
                warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : undefined
            };

            if (editingMachine) {
                await api.put(`/machines/${editingMachine.id}`, payload);
            } else {
                await api.post('/machines', payload);
            }
            fetchMachines();
            closeModal();
        } catch (error) {
            logger.error('Error saving machine:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mesin ini?')) {
            try {
                await api.delete(`/machines/${id}`);
                fetchMachines();
            } catch (error) {
                logger.error('Error deleting machine:', error);
            }
        }
    };

    const openModal = (machine?: Machine) => {
        if (machine) {
            setEditingMachine(machine);
            setFormData({
                id_factory: machine.id_factory,
                code: machine.code,
                name: machine.name,
                machine_type: machine.machine_type || '',
                serial_number: machine.serial_number || '',
                manufacture_year: machine.manufacture_year?.toString() || '',
                capacity_per_hour: machine.capacity_per_hour?.toString() || '',
                status: machine.status,
                purchase_date: machine.purchase_date?.split('T')[0] || '',
                vendor_id: machine.vendor_id?.toString() || '',
                purchase_price: machine.purchase_price?.toString() || '',
                warranty_months: machine.warranty_months?.toString() || '12'
            });
        } else {
            setEditingMachine(null);
            // Auto-generate code
            const nextCode = `MSN-${String(machines.length + 1).padStart(3, '0')}`;
            setFormData({
                id_factory: selectedFactory,
                code: nextCode,
                name: '',
                machine_type: '',
                serial_number: '',
                manufacture_year: '',
                capacity_per_hour: '',
                status: 'ACTIVE',
                purchase_date: '',
                vendor_id: '',
                purchase_price: '',
                warranty_months: '12'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingMachine(null);
    };

    // Filter machines by selected factory
    const filteredMachines = machines.filter(m =>
        selectedFactory === 0 || m.id_factory === selectedFactory
    );

    // Stats calculations
    const totalMachines = filteredMachines.length;
    const activeMachines = filteredMachines.filter(m => m.status === 'ACTIVE').length;
    const maintenanceMachines = filteredMachines.filter(m => m.status === 'MAINTENANCE').length;
    const inactiveMachines = filteredMachines.filter(m => m.status === 'INACTIVE').length;

    return (
        <>
            <Header title="Mesin Produksi" subtitle="Kelola mesin dan peralatan produksi" />

            <div className="page-content">
                {/* Factory Toggle */}
                <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Lokasi Pabrik:</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className={`btn ${selectedFactory === 0 ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSelectedFactory(0)}
                                style={{ minWidth: 100 }}
                            >
                                Semua
                            </button>
                            {factories.map(factory => (
                                <button
                                    key={factory.id}
                                    className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedFactory(factory.id)}
                                    style={{ minWidth: 100 }}
                                >
                                    <span className="material-symbols-outlined icon-sm">
                                        {factory.code === 'PMD-1' ? 'factory' : 'warehouse'}
                                    </span>
                                    {factory.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Mesin</span>
                            <span className="material-symbols-outlined stat-card-icon">precision_manufacturing</span>
                        </div>
                        <div className="stat-card-value">{totalMachines}</div>
                        <span className="badge badge-muted">Unit</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Mesin Aktif</span>
                            <span className="material-symbols-outlined stat-card-icon">check_circle</span>
                        </div>
                        <div className="stat-card-value">{activeMachines}</div>
                        <span className="badge badge-success">
                            <span className="material-symbols-outlined icon-sm">trending_up</span>
                            {totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0}%
                        </span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Sedang Maintenance</span>
                            <span className="material-symbols-outlined stat-card-icon">build</span>
                        </div>
                        <div className="stat-card-value">{maintenanceMachines}</div>
                        <span className="badge badge-warning">Dalam Perbaikan</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Tidak Aktif</span>
                            <span className="material-symbols-outlined stat-card-icon">cancel</span>
                        </div>
                        <div className="stat-card-value">{inactiveMachines}</div>
                        <span className="badge badge-error">Perlu Perhatian</span>
                    </div>
                </div>

                {/* Machine List */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Daftar Mesin</h3>
                            <p className="card-subtitle">
                                {selectedFactory === 0
                                    ? 'Semua mesin di semua pabrik'
                                    : `Mesin di ${factories.find(f => f.id === selectedFactory)?.name || 'Pabrik'}`}
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Tambah Mesin
                        </button>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                            </div>
                            <h3>Memuat data...</h3>
                        </div>
                    ) : filteredMachines.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">precision_manufacturing</span>
                            </div>
                            <h3>Belum ada mesin</h3>
                            <p>Klik tombol "Tambah Mesin" untuk menambahkan mesin baru</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Pabrik</th>
                                        <th>Kode</th>
                                        <th>Nama Mesin</th>
                                        <th>Tipe</th>
                                        <th>Serial Number</th>
                                        <th>Kapasitas/Jam</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMachines.map((machine) => {
                                        const status = statusConfig[machine.status];
                                        return (
                                            <tr key={machine.id}>
                                                <td>
                                                    <span className="badge badge-muted">
                                                        {machine.otm_id_factory?.name || `Factory ${machine.id_factory}`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                                                        {machine.code}
                                                    </span>
                                                </td>
                                                <td>{machine.name}</td>
                                                <td>{machine.machine_type || '-'}</td>
                                                <td>
                                                    <span className="font-mono" style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                                        {machine.serial_number || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="font-mono">{machine.capacity_per_hour || 0}</span> kg
                                                </td>
                                                <td>
                                                    <span className={`badge ${status.class}`}>
                                                        <span className="material-symbols-outlined icon-sm">{status.icon}</span>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(machine)}>
                                                            <span className="material-symbols-outlined icon-sm">edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(machine.id)}>
                                                            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form - Redesigned */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                                    precision_manufacturing
                                </span>
                                <h3 className="modal-title">
                                    {editingMachine ? 'Edit Mesin' : 'Tambah Mesin Baru'}
                                </h3>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* Section 1: Informasi Umum & Teknis */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 16,
                                        paddingBottom: 8,
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <span style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>1</span>
                                        <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', fontSize: 12 }}>
                                            INFORMASI UMUM & TEKNIS
                                        </span>
                                    </div>

                                    {/* Lokasi Pabrik */}
                                    <div className="form-group">
                                        <label className="form-label">
                                            Lokasi Pabrik <span style={{ color: 'var(--error)' }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {factories.map(factory => (
                                                <button
                                                    key={factory.id}
                                                    type="button"
                                                    className={`btn ${formData.id_factory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => setFormData({ ...formData, id_factory: factory.id })}
                                                    style={{ flex: 1, padding: '10px 16px' }}
                                                >
                                                    <span className="material-symbols-outlined icon-sm">
                                                        {factory.code === 'PMD-1' ? 'factory' : 'warehouse'}
                                                    </span>
                                                    {factory.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kode & Nama - 2 columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Kode Mesin</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                placeholder="MSN-001"
                                                required
                                                style={{ color: 'var(--primary)', fontWeight: 500 }}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nama Mesin</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Mesin Giling Padi"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Tipe & Serial - 2 columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Tipe Mesin</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.machine_type}
                                                onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
                                                placeholder="Husker, Polisher, Grader, dll"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Serial Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.serial_number}
                                                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                                placeholder="SN-XXXX-YYYY"
                                            />
                                        </div>
                                    </div>

                                    {/* Tahun, Kapasitas, Status - 3 columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Tahun Manufaktur</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={formData.manufacture_year}
                                                onChange={(e) => setFormData({ ...formData, manufacture_year: e.target.value })}
                                                placeholder="YYYY"
                                                min="1990"
                                                max="2030"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                Kapasitas/Jam <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>KG</span>
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={formData.capacity_per_hour}
                                                    onChange={(e) => setFormData({ ...formData, capacity_per_hour: e.target.value })}
                                                    placeholder="1000"
                                                    step="0.01"
                                                />
                                                <span className="input-addon">kg</span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Status Operasional</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="ACTIVE">● Aktif</option>
                                                <option value="MAINTENANCE">● Maintenance</option>
                                                <option value="INACTIVE">● Tidak Aktif</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Informasi Pembelian */}
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 16,
                                        paddingBottom: 8,
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <span style={{
                                            background: 'var(--primary)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}>2</span>
                                        <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', fontSize: 12 }}>
                                            INFORMASI PEMBELIAN
                                        </span>
                                    </div>

                                    {/* Tanggal & Vendor - 2 columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Tanggal Pembelian</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.purchase_date}
                                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Vendor/Supplier</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.vendor_id}
                                                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                            >
                                                <option value="">Pilih Vendor</option>
                                                {suppliers.map(supplier => (
                                                    <option key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Harga & Garansi - 2 columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label className="form-label">Harga Beli</label>
                                            <div className="input-group">
                                                <span className="input-addon">Rp</span>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={formData.purchase_price}
                                                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Masa Garansi</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={formData.warranty_months}
                                                    onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                                                    placeholder="12"
                                                    min="0"
                                                />
                                                <span className="input-addon">Bulan</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <span className="material-symbols-outlined icon-sm">save</span>
                                    {editingMachine ? 'Simpan Perubahan' : 'Tambah Mesin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Machines;
