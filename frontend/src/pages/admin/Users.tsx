import { useState, useEffect } from 'react';

import { userApi, factoryApi } from '../../services/api';
import { logger } from '../../utils/logger';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface User {
    id: number;
    email: string;
    fullname: string;
    role: string;
    id_factory: number | null;
    is_active: boolean;
    Factory?: {
        name: string;
    };
    created_at: string;
}

interface Factory {
    id: number;
    name: string;
}

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const [formData, setFormData] = useState({
        email: '',
        fullname: '',
        password: '',
        role: 'OPERATOR',
        id_factory: ''
    });

    const [passwordData, setPasswordData] = useState({
        new_password: '',
        confirm_password: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, factoriesRes] = await Promise.all([
                userApi.getAll({ limit: 100 }),
                factoryApi.getAll({ limit: 50 })
            ]);

            const userData = usersRes.data?.data || usersRes.data || [];
            setUsers(Array.isArray(userData) ? userData : []);

            const factoryData = factoriesRes.data?.data || factoriesRes.data || [];
            setFactories(Array.isArray(factoryData) ? factoryData : []);
        } catch (error) {
            logger.error('Error fetching data:', error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };


    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullname.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        adminCount: users.filter(u => ['ADMIN', 'SUPERUSER'].includes(u.role)).length,
        operatorCount: users.filter(u => u.role === 'OPERATOR').length
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                fullname: user.fullname,
                password: '', // not used for edit
                role: user.role,
                id_factory: user.id_factory?.toString() || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                fullname: '',
                password: '',
                role: 'OPERATOR',
                id_factory: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
    };

    const openPasswordModal = (id: number) => {
        setSelectedUserId(id);
        setPasswordData({ new_password: '', confirm_password: '' });
        setShowPasswordModal(true);
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedUserId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id_factory: formData.id_factory ? parseInt(formData.id_factory) : undefined
            };

            if (editingUser) {
                // Remove password for update
                const { password, ...updatePayload } = payload;
                await userApi.update(editingUser.id, updatePayload);
                toast.success('User berhasil diupdate');
            } else {
                if (!formData.password || formData.password.length < 6) {
                    toast.error('Password minimal 6 karakter');
                    return;
                }
                await userApi.create(payload);
                toast.success('User berhasil ditambahkan');
            }
            fetchData();
            closeModal();
        } catch (error: any) {
            logger.error('Error saving user:', error);
            const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Gagal menyimpan user';
            toast.error(msg);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }
        if (passwordData.new_password.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        try {
            if (selectedUserId) {
                await userApi.resetPassword(selectedUserId, { new_password: passwordData.new_password });
                toast.success('Password berhasil direset');
                closePasswordModal();
            }
        } catch (error: any) {
            logger.error('Error resetting password:', error);
            const msg = error.response?.data?.error?.message || error.response?.data?.message || 'Gagal mereset password';
            toast.error(msg);
        }
    };

    const handleToggleActive = async (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error('Anda tidak dapat menonaktifkan diri sendiri');
            return;
        }

        const action = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (window.confirm(`Apakah Anda yakin ingin ${action} user ini?`)) {
            try {
                await userApi.update(user.id, { is_active: !user.is_active });
                toast.success(`User berhasil di${user.is_active ? 'nonaktifkan' : 'aktifkan'}`);
                fetchData();
            } catch (error) {
                logger.error('Error toggling user status:', error);
                toast.error('Gagal mengubah status user');
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPERUSER': return 'badge-error';
            case 'ADMIN': return 'badge-warning';
            case 'MANAGER': return 'badge-info';
            case 'SUPERVISOR': return 'badge-success';
            default: return 'badge-secondary';
        }
    };

    return (
        <div className="page-content animate-fade-up">

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card premium">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Total User</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <span className="material-symbols-outlined">person_check</span>
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">User Aktif</div>
                        <div className="stat-value">{stats.active}</div>
                    </div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <span className="material-symbols-outlined">admin_panel_settings</span>
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Admin+</div>
                        <div className="stat-value">{stats.adminCount}</div>
                    </div>
                </div>
                <div className="stat-card premium">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}>
                        <span className="material-symbols-outlined">engineering</span>
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Operator</div>
                        <div className="stat-value">{stats.operatorCount}</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card premium-card">
                <div className="card-header page-header-responsive">
                    <h3 className="card-title">Daftar Pengguna</h3>
                    <div className="header-actions-mobile">
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 18 }}>search</span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Cari nama atau email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: 40, width: '100%' }}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">Semua Role</option>
                            <option value="OPERATOR">OPERATOR</option>
                            <option value="SUPERVISOR">SUPERVISOR</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            <span className="material-symbols-outlined">add</span>
                            <span className="hide-mobile">Tambah User</span>
                            <span className="show-mobile-inline">Tambah</span>
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama Lengkap</th>
                                <th className="hide-mobile">Email</th>
                                <th>Role</th>
                                <th className="hide-mobile">Pabrik</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                                        <span className="material-symbols-outlined spin" style={{ fontSize: 32, color: 'var(--primary)' }}>refresh</span>
                                        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Memuat data pengguna...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                                        <div style={{ opacity: 0.5 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person_search</span>
                                            <p style={{ marginTop: 8 }}>Tidak ada user yang ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {u.fullname.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullname}</div>
                                                    <div className="show-mobile" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                                                </div>
                                                {u.id === currentUser?.id && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Anda</span>}
                                            </div>
                                        </td>
                                        <td className="hide-mobile font-mono" style={{ fontSize: '0.85rem' }}>{u.email}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span>
                                        </td>
                                        <td className="hide-mobile">{u.Factory?.name || 'Semua Pabrik'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span className={`status-indicator ${u.is_active ? 'status-online' : 'status-offline'}`} />
                                                <span className="hide-mobile">{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                {(u.role !== 'SUPERUSER' || currentUser?.role === 'SUPERUSER') && (
                                                    <>
                                                        <button
                                                            className="btn btn-icon btn-ghost"
                                                            style={{ color: 'var(--primary)' }}
                                                            title="Edit User"
                                                            onClick={() => openModal(u)}
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                        </button>
                                                        <button
                                                            className="btn btn-icon btn-ghost"
                                                            style={{ color: 'var(--warning)' }}
                                                            title="Reset Password"
                                                            onClick={() => openPasswordModal(u.id)}
                                                        >
                                                            <span className="material-symbols-outlined">lock_reset</span>
                                                        </button>
                                                        <button
                                                            className={`btn btn-icon btn-ghost ${u.is_active ? 'text-error' : 'text-success'}`}
                                                            title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                            onClick={() => handleToggleActive(u)}
                                                            disabled={u.id === currentUser?.id}
                                                        >
                                                            <span className="material-symbols-outlined">{u.is_active ? 'person_off' : 'person_check'}</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                            <button className="btn-icon" onClick={closeModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.fullname}
                                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="budi@perusahaan.com"
                                    />
                                </div>

                                {!editingUser && (
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Role</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="OPERATOR">OPERATOR</option>
                                            <option value="SUPERVISOR">SUPERVISOR</option>
                                            <option value="MANAGER">MANAGER</option>
                                            <option value="ADMIN">ADMIN</option>
                                            {currentUser?.role === 'SUPERUSER' && <option value="SUPERUSER">SUPERUSER</option>}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Pabrik</label>
                                        <select
                                            className="form-select"
                                            value={formData.id_factory}
                                            onChange={(e) => setFormData({ ...formData, id_factory: e.target.value })}
                                        >
                                            <option value="">Semua Pabrik (Global)</option>
                                            {factories.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Simpan Perubahan' : 'Buat User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Reset Password</h3>
                            <button className="btn-icon" onClick={closePasswordModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-body">
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                    Masukkan password baru untuk user ini.
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Password Baru</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        required
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        required
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        placeholder="Ulangi password baru"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>Batal</button>
                                <button type="submit" className="btn btn-primary">Reset Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
