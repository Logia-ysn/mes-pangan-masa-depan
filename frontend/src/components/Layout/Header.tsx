import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLayout } from '../../contexts/LayoutContext';
import { notificationApi } from '../../services/api';

interface Notification {
    id: number;
    type: string;
    severity: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface HeaderProps {
    title: string;
    subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { toggleSidebar } = useLayout();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count on mount and poll every 60s
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await notificationApi.getCount();
                setUnreadCount(res.data?.count ?? 0);
            } catch { /* ignore */ }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Also trigger alert check on mount
    useEffect(() => {
        notificationApi.check().catch(() => {});
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenNotifications = async () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            try {
                const res = await notificationApi.getAll({ limit: 20 });
                setNotifications(res.data?.notifications ?? []);
            } catch { /* ignore */ }
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'var(--danger, #d32f2f)';
            case 'WARNING': return 'var(--warning, #ef6c00)';
            default: return 'var(--primary, #1565c0)';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'LOW_STOCK': return 'inventory';
            case 'OVERDUE_INVOICE': return 'receipt_long';
            case 'OVERDUE_MAINTENANCE': return 'build';
            default: return 'info';
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        const days = Math.floor(hours / 24);
        return `${days} hari lalu`;
    };

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn btn-ghost btn-icon menu-toggle" onClick={toggleSidebar}>
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="header-title">
                    <h2>{title}</h2>
                    {subtitle && <span className="header-subtitle">{subtitle}</span>}
                </div>
            </div>

            <div className="header-search">
                <span className="material-symbols-outlined icon-sm">search</span>
                <input type="text" placeholder="Cari di mana saja..." />
            </div>

            <div className="header-actions">
                {/* Theme Toggle */}
                <button
                    className={`header-action-btn ${theme === 'dark' ? 'active' : ''}`}
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <span className="material-symbols-outlined icon-md">
                        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                </button>

                {/* Notifications */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        className="header-action-btn"
                        title="Notifikasi"
                        onClick={handleOpenNotifications}
                        style={{ position: 'relative' }}
                    >
                        <span className="material-symbols-outlined icon-md">notifications</span>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'var(--danger, #d32f2f)',
                                color: '#fff',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 8,
                            width: 380,
                            maxHeight: 480,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 12,
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 1000,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifikasi</h4>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Tandai semua dibaca
                                    </button>
                                )}
                            </div>

                            {/* Notification List */}
                            <div style={{ overflowY: 'auto', maxHeight: 400 }}>
                                {notifications.length === 0 ? (
                                    <div style={{
                                        padding: '2rem',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>
                                            notifications_off
                                        </span>
                                        <p style={{ margin: 0 }}>Tidak ada notifikasi</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: notif.is_read ? 'default' : 'pointer',
                                                background: notif.is_read ? 'transparent' : 'var(--bg-hover, rgba(0,0,0,0.02))',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 8,
                                                background: `${getSeverityColor(notif.severity)}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <span
                                                    className="material-symbols-outlined"
                                                    style={{ fontSize: 18, color: getSeverityColor(notif.severity) }}
                                                >
                                                    {getTypeIcon(notif.type)}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'start',
                                                    gap: 8,
                                                }}>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.8rem',
                                                        fontWeight: notif.is_read ? 400 : 600,
                                                        color: 'var(--text-primary)',
                                                        lineHeight: 1.3,
                                                    }}>
                                                        {notif.title}
                                                    </p>
                                                    {!notif.is_read && (
                                                        <div style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: 'var(--primary)',
                                                            flexShrink: 0,
                                                            marginTop: 4,
                                                        }} />
                                                    )}
                                                </div>
                                                <p style={{
                                                    margin: '2px 0 0',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-muted)',
                                                    lineHeight: 1.4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {notif.message}
                                                </p>
                                                <p style={{
                                                    margin: '4px 0 0',
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-muted)',
                                                }}>
                                                    {timeAgo(notif.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="user-menu">
                    <div className="user-avatar">
                        {user?.fullname?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullname || 'User'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'Operator'}</span>
                    </div>
                </div>

                {/* Logout */}
                <button className="header-action-btn" onClick={logout} title="Logout">
                    <span className="material-symbols-outlined icon-md">logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
