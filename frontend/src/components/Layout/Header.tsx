import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="header">
            <div className="header-left">
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
                <button className="header-action-btn" title="Notifikasi">
                    <span className="material-symbols-outlined icon-md">notifications</span>
                </button>

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
