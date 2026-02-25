import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, employeeApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface AttendanceRow {
    id: number;
    attendance_date: string;
    check_in_time?: string;
    check_out_time?: string;
    status: string;
    notes?: string;
    Employee?: { id: number; employee_code: string; fullname: string; position: string; department?: string };
    User?: { id: number; fullname: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    PRESENT: { label: 'Hadir', color: '#16a34a', icon: 'check_circle' },
    ABSENT: { label: 'Absen', color: '#dc2626', icon: 'cancel' },
    LATE: { label: 'Terlambat', color: '#ea580c', icon: 'schedule' },
    SICK: { label: 'Sakit', color: '#7c3aed', icon: 'local_hospital' },
    LEAVE: { label: 'Cuti', color: '#2563eb', icon: 'flight_takeoff' },
};

const Attendance = () => {
    const { showError, showSuccess } = useToast();
    const [records, setRecords] = useState<AttendanceRow[]>([]);
    const [employees, setEmployees] = useState<{ id: number; fullname: string; employee_code: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit] = useState(30);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
    const [filterStatus, setFilterStatus] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ id_employee: '', status: 'PRESENT', check_in_time: '08:00', check_out_time: '17:00', notes: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { limit, offset: page * limit };
            if (filterDate) {
                params.start_date = filterDate;
                params.end_date = filterDate;
            }
            if (filterStatus) params.status = filterStatus;

            const res = await attendanceApi.getAll(params);
            const d = res.data?.data || res.data;
            if (Array.isArray(d)) {
                setRecords(d);
                setTotal(res.data?.total || d.length);
            } else if (d?.data) {
                setRecords(d.data);
                setTotal(d.total || d.data.length);
            }
        } catch {
            showError('Gagal', 'Gagal memuat data absensi');
        } finally {
            setLoading(false);
        }
    }, [page, limit, filterDate, filterStatus, showError]);

    useEffect(() => {
        employeeApi.getAll({ limit: 200, is_active: true }).then(r => {
            const d = r.data?.data || r.data || [];
            setEmployees(Array.isArray(d) ? d : d.data || []);
        }).catch(() => { });
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatTime = (t?: string) => {
        if (!t) return '-';
        try {
            const d = new Date(t);
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch { return t; }
    };

    const handleCreate = async () => {
        if (!formData.id_employee) { showError('Error', 'Pilih karyawan'); return; }
        try {
            await attendanceApi.create({
                id_employee: Number(formData.id_employee),
                attendance_date: filterDate,
                check_in_time: formData.check_in_time || undefined,
                check_out_time: formData.check_out_time || undefined,
                status: formData.status,
                notes: formData.notes || undefined,
            });
            showSuccess('Berhasil', 'Data absensi ditambahkan');
            setShowForm(false);
            setFormData({ id_employee: '', status: 'PRESENT', check_in_time: '08:00', check_out_time: '17:00', notes: '' });
            fetchData();
        } catch {
            showError('Gagal', 'Gagal menambahkan absensi');
        }
    };

    const totalPages = Math.ceil(total / limit);
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;
    const absentCount = records.filter(r => r.status === 'ABSENT' || r.status === 'SICK' || r.status === 'LEAVE').length;

    return (
        <div className="page-content">
            {/* Summary Cards */}
            <div className="grid grid-4" style={{ marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TOTAL RECORD</div>
                    <div className="text-2xl font-bold">{total}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>HADIR</div>
                    <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{presentCount}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TERLAMBAT</div>
                    <div className="text-2xl font-bold" style={{ color: '#ea580c' }}>{lateCount}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div className="text-secondary text-sm" style={{ marginBottom: 4 }}>TIDAK HADIR</div>
                    <div className="text-2xl font-bold" style={{ color: '#dc2626' }}>{absentCount}</div>
                </div>
            </div>

            {/* Filters + Add */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, padding: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="date" className="form-input" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(0); }} />
                    <select className="form-input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} style={{ minWidth: 140 }}>
                        <option value="">Semua Status</option>
                        <option value="PRESENT">Hadir</option>
                        <option value="LATE">Terlambat</option>
                        <option value="ABSENT">Absen</option>
                        <option value="SICK">Sakit</option>
                        <option value="LEAVE">Cuti</option>
                    </select>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                        <span className="material-symbols-outlined icon-sm">add</span> Tambah Absensi
                    </button>
                </div>

                {/* Quick Add Form */}
                {showForm && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', marginTop: -1, paddingTop: 16 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <label className="text-sm text-secondary">Karyawan</label>
                                <select className="form-input" value={formData.id_employee} onChange={e => setFormData(f => ({ ...f, id_employee: e.target.value }))} style={{ width: '100%' }}>
                                    <option value="">Pilih karyawan...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.employee_code} — {emp.fullname}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-secondary">Status</label>
                                <select className="form-input" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
                                    <option value="PRESENT">Hadir</option>
                                    <option value="LATE">Terlambat</option>
                                    <option value="ABSENT">Absen</option>
                                    <option value="SICK">Sakit</option>
                                    <option value="LEAVE">Cuti</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-secondary">Jam Masuk</label>
                                <input type="time" className="form-input" value={formData.check_in_time} onChange={e => setFormData(f => ({ ...f, check_in_time: e.target.value }))} />
                            </div>
                            <div>
                                <label className="text-sm text-secondary">Jam Keluar</label>
                                <input type="time" className="form-input" value={formData.check_out_time} onChange={e => setFormData(f => ({ ...f, check_out_time: e.target.value }))} />
                            </div>
                            <div style={{ minWidth: 160 }}>
                                <label className="text-sm text-secondary">Catatan</label>
                                <input className="form-input" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Opsional" style={{ width: '100%' }} />
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Simpan</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Batal</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Data Absensi — {new Date(filterDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="table-container">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th className="text-left">Kode</th>
                                <th className="text-left">Nama</th>
                                <th className="text-left hide-mobile">Jabatan</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Jam Masuk</th>
                                <th className="text-center">Jam Keluar</th>
                                <th className="text-left hide-mobile">Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                                    <div>Memuat data...</div>
                                </td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>event_busy</span>
                                    <div style={{ marginTop: 8 }}>Belum ada data absensi untuk tanggal ini</div>
                                </td></tr>
                            ) : records.map(r => {
                                const sc = statusConfig[r.status] || { label: r.status, color: '#6b7280', icon: 'help' };
                                return (
                                    <tr key={r.id}>
                                        <td className="font-mono">{r.Employee?.employee_code || '-'}</td>
                                        <td className="font-medium">{r.Employee?.fullname || '-'}</td>
                                        <td className="hide-mobile text-secondary">{r.Employee?.position || '-'}</td>
                                        <td className="text-center">
                                            <span className="badge" style={{ background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}40` }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>{sc.icon}</span>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="text-center font-mono">{formatTime(r.check_in_time)}</td>
                                        <td className="text-center font-mono">{formatTime(r.check_out_time)}</td>
                                        <td className="hide-mobile text-secondary">{r.notes || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

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

export default Attendance;
