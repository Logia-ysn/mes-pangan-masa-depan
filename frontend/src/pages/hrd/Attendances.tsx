import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import { attendanceApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

interface Attendance {
    id: number;
    id_employee: number;
    attendance_date: string;
    check_in_time: string;
    check_out_time: string;
    status: string;
}

const Attendances = () => {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendances();
    }, []);

    const fetchAttendances = async () => {
        try {
            const res = await attendanceApi.getAll({ limit: 100 });
            setAttendances(res.data.data || res.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const data = attendances.map(a => ({
            Date: new Date(a.attendance_date).toLocaleDateString('id-ID'),
            'Employee ID': a.id_employee,
            'Check In': a.check_in_time,
            'Check Out': a.check_out_time,
            Status: a.status
        }));
        exportToCSV(data, `Attendance_${new Date().toISOString().split('T')[0]}`);
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const getStatusBadge = (status: string) => {
        const map: { [key: string]: string } = {
            'PRESENT': 'badge-success',
            'ABSENT': 'badge-error',
            'SICK': 'badge-warning',
            'LEAVE': 'badge-info',
            'PERMISSION': 'badge-info',
        };
        return map[status] || 'badge-muted';
    };

    // Stats
    const totalPresent = attendances.filter(a => a.status === 'PRESENT').length; // Ideally filter by today but using all for now
    const totalAbsent = attendances.filter(a => a.status === 'ABSENT').length;
    const totalSick = attendances.filter(a => a.status === 'SICK').length;
    const totalLeave = attendances.filter(a => ['LEAVE', 'PERMISSION'].includes(a.status)).length;

    return (
        <>
            <Header title="Kehadiran" subtitle="Monitoring absensi karyawan" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Hadir</span>
                            <span className="material-symbols-outlined stat-card-icon">check_circle</span>
                        </div>
                        <div className="stat-card-value">{totalPresent}</div>
                        <span className="badge badge-success">Present</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Tidak Hadir</span>
                            <span className="material-symbols-outlined stat-card-icon">cancel</span>
                        </div>
                        <div className="stat-card-value">{totalAbsent}</div>
                        <span className="badge badge-error">Absent</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Sakit</span>
                            <span className="material-symbols-outlined stat-card-icon">sick</span>
                        </div>
                        <div className="stat-card-value">{totalSick}</div>
                        <span className="badge badge-warning">Sick</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Izin / Cuti</span>
                            <span className="material-symbols-outlined stat-card-icon">event_busy</span>
                        </div>
                        <div className="stat-card-value">{totalLeave}</div>
                        <span className="badge badge-info">Leave</span>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Riwayat Kehadiran</h3>
                            <p className="card-subtitle">Semua data absensi</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={handleExport}>
                                <span className="material-symbols-outlined icon-sm">download</span>
                                Export
                            </button>
                            <button className="btn btn-secondary">
                                <span className="material-symbols-outlined icon-sm">calendar_today</span>
                                Filter Tanggal
                            </button>
                            <button className="btn btn-primary">
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Input Kehadiran
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
                    ) : attendances.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined">event_busy</span>
                            </div>
                            <h3>Belum ada data kehadiran</h3>
                            <p>Silakan input data kehadiran hari ini</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>ID Karyawan</th>
                                        <th>Jam Masuk</th>
                                        <th>Jam Keluar</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.map((att) => (
                                        <tr key={att.id}>
                                            <td>
                                                <span className="font-medium">{formatDate(att.attendance_date)}</span>
                                            </td>
                                            <td className="font-mono">#{att.id_employee}</td>
                                            <td className="font-mono">{att.check_in_time || '-'}</td>
                                            <td className="font-mono">{att.check_out_time || '-'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(att.status)}`}>
                                                    {att.status === 'SICK' && <span className="material-symbols-outlined icon-sm">sick</span>}
                                                    {att.status === 'PRESENT' && <span className="material-symbols-outlined icon-sm">check</span>}
                                                    {att.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost btn-sm">
                                                    <span className="material-symbols-outlined icon-sm">edit</span>
                                                </button>
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

export default Attendances;
