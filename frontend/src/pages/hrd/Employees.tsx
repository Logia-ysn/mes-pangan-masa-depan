import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import { employeeApi } from '../../services/api';

interface Employee {
    id: number;
    employee_code: string;
    fullname: string;
    position: string;
    department: string;
    employment_status: string;
    is_active: boolean;
}

const Employees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await employeeApi.getAll({ limit: 100 });
            setEmployees(res.data.data || res.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.is_active).length;
    const permanentEmployees = employees.filter(e => e.employment_status === 'PERMANENT').length;
    const contractEmployees = employees.filter(e => e.employment_status === 'CONTRACT').length;

    return (
        <>
            <Header title="Karyawan" subtitle="Manajemen data sumber daya manusia" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Karyawan</span>
                            <span className="material-symbols-outlined stat-card-icon">group</span>
                        </div>
                        <div className="stat-card-value">{totalEmployees}</div>
                        <span className="badge badge-muted">Orang</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Karyawan Aktif</span>
                            <span className="material-symbols-outlined stat-card-icon">verified_user</span>
                        </div>
                        <div className="stat-card-value">{activeEmployees}</div>
                        <span className="badge badge-success">Active</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Karyawan Tetap</span>
                            <span className="material-symbols-outlined stat-card-icon">badge</span>
                        </div>
                        <div className="stat-card-value">{permanentEmployees}</div>
                        <span className="badge badge-info">Permanent</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Kontrak</span>
                            <span className="material-symbols-outlined stat-card-icon">contract</span>
                        </div>
                        <div className="stat-card-value">{contractEmployees}</div>
                        <span className="badge badge-warning">Contract</span>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Daftar Karyawan</h3>
                            <p className="card-subtitle">Semua departemen</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary">
                                <span className="material-symbols-outlined icon-sm">filter_list</span>
                                Filter
                            </button>
                            <button className="btn btn-primary">
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Tambah Karyawan
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
                    ) : employees.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">group_off</span>
                            </div>
                            <h3>Belum ada data karyawan</h3>
                            <p>Silakan tambahkan data karyawan baru</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>NIK</th>
                                        <th>Nama</th>
                                        <th>Jabatan</th>
                                        <th>Departemen</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="font-mono">{emp.employee_code}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                                    }}>
                                                        {emp.fullname.charAt(0)}
                                                    </div>
                                                    <span className="font-medium">{emp.fullname}</span>
                                                </div>
                                            </td>
                                            <td>{emp.position}</td>
                                            <td>
                                                <span className="badge badge-muted">{emp.department}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-error'}`}>
                                                    <span className="material-symbols-outlined icon-sm">
                                                        {emp.is_active ? 'check_circle' : 'cancel'}
                                                    </span>
                                                    {emp.employment_status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button className="btn btn-ghost btn-sm">
                                                        <span className="material-symbols-outlined icon-sm">edit</span>
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm">
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
        </>
    );
};

export default Employees;
