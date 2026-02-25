import { useState, useEffect, useCallback } from 'react';
import { employeeApi, factoryApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface EmployeeRow {
    id: number;
    employee_code: string;
    fullname: string;
    position: string;
    department?: string;
    phone?: string;
    gender: string;
    employment_status: string;
    join_date: string;
    is_active: boolean;
    salary?: number;
    Factory?: { id: number; name: string };
}

const Employees = () => {
    const { showError } = useToast();
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [factories, setFactories] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);
    const [search, setSearch] = useState('');
    const [filterFactory, setFilterFactory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { limit, offset: page * limit };
            if (search) params.search = search;
            if (filterFactory) params.id_factory = Number(filterFactory);
            if (filterStatus) params.is_active = filterStatus === 'active';

            const res = await employeeApi.getAll(params);
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setEmployees(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setEmployees(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data karyawan');
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, filterFactory, filterStatus, showError]);

    useEffect(() => {
        factoryApi.getAll().then(r => setFactories(r.data?.data || r.data || [])).catch(() => { });
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const totalPages = Math.ceil(total / limit);

    const statusBadge = (isActive: boolean) => (
        <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
            {isActive ? 'Aktif' : 'Nonaktif'}
        </span>
    );

    const empStatusBadge = (status: string) => {
        const map: Record<string, { label: string; cls: string }> = {
            PERMANENT: { label: 'Tetap', cls: 'badge-success' },
            CONTRACT: { label: 'Kontrak', cls: 'badge-warning' },
            PROBATION: { label: 'Probasi', cls: 'badge-info' },
            INTERN: { label: 'Magang', cls: 'badge-secondary' },
        };
        const s = map[status] || { label: status, cls: 'badge-secondary' };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
    };

    const activeCount = employees.filter(e => e.is_active).length;

    return (
        <div className="page-content">
            {/* Summary */}
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL KARYAWAN</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>AKTIF</div>
                    <div className="text-2xl font-bold text-success">{activeCount}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>NONAKTIF</div>
                    <div className="text-2xl font-bold text-error">{employees.length - activeCount}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>HALAMAN</div>
                    <div className="text-2xl font-bold">{page + 1} / {totalPages || 1}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <input
                            className="form-input"
                            placeholder="Cari nama karyawan..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <select className="form-input" value={filterFactory} onChange={e => { setFilterFactory(e.target.value); setPage(0); }} style={{ minWidth: 160 }}>
                        <option value="">Semua Pabrik</option>
                        {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select className="form-input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} style={{ minWidth: 140 }}>
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Data Karyawan</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">Kode</th>
                                <th className="text-left">Nama Lengkap</th>
                                <th className="text-left">Jabatan</th>
                                <th className="text-left hide-mobile">Departemen</th>
                                <th className="text-left">Tipe</th>
                                <th className="text-left hide-mobile">Tanggal Masuk</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>groups</span>
                                    <div style={{ marginTop: 8 }}>Belum ada data karyawan</div>
                                </td></tr>
                            ) : employees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="font-mono">{emp.employee_code}</td>
                                    <td className="font-medium">{emp.fullname}</td>
                                    <td>{emp.position}</td>
                                    <td className="hide-mobile text-secondary">{emp.department || '-'}</td>
                                    <td>{empStatusBadge(emp.employment_status)}</td>
                                    <td className="hide-mobile">{formatDate(emp.join_date)}</td>
                                    <td className="text-center">{statusBadge(emp.is_active)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
                        <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                            <span className="material-symbols-outlined icon-sm">chevron_left</span>
                        </button>
                        <span style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{page + 1} dari {totalPages}</span>
                        <button className="btn btn-secondary btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                            <span className="material-symbols-outlined icon-sm">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Employees;
