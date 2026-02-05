import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/pmd_logo.png';
import './Sidebar.css';

interface NavItemConfig {
    label: string;
    icon: string;
    to?: string;
    children?: { label: string; to: string; icon?: string }[];
}

const navItems: NavItemConfig[] = [
    { label: 'Dashboard', icon: 'dashboard', to: '/' },
    {
        label: 'Produksi',
        icon: 'factory',
        children: [
            { label: 'Worksheet', to: '/production/worksheets' },
            { label: 'Jadwal Produksi', to: '/production/schedule' },
            { label: 'Penerimaan Bahan', to: '/production/raw-materials' },
            { label: 'Stok & Inventory', to: '/production/stocks' },
            { label: 'Mesin', to: '/production/machines' },
            { label: 'Maintenance', to: '/production/maintenance' },
            { label: 'OEE Monitor', to: '/production/oee' },
        ]
    },
    {
        label: 'Penjualan',
        icon: 'shopping_cart',
        children: [
            { label: 'Pelanggan', to: '/sales/customers' },
            { label: 'Invoice', to: '/sales/invoices' },
            { label: 'Pembayaran', to: '/sales/payments' },
        ]
    },
    {
        label: 'Keuangan',
        icon: 'account_balance_wallet',
        children: [
            { label: 'Pengeluaran', to: '/finance/expenses' },
            { label: 'Laporan', to: '/finance/reports' },
        ]
    },
    {
        label: 'HRD',
        icon: 'group',
        children: [
            { label: 'Karyawan', to: '/hrd/employees' },
            { label: 'Kehadiran', to: '/hrd/attendances' },
        ]
    }
];

const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);


    // Auto-expand group if child is active
    useEffect(() => {
        const activeGroup = navItems.find(item =>
            item.children?.some(child => location.pathname.startsWith(child.to))
        );
        if (activeGroup && !expandedGroups.includes(activeGroup.label)) {
            setExpandedGroups(prev => [...prev, activeGroup.label]);
        }
    }, [location.pathname]);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    const isGroupActive = (item: NavItemConfig) => {
        return item.children?.some(child => location.pathname.startsWith(child.to));
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
                        <img src={logo} alt="PMD" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1>ERP PMD</h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <div key={item.label} className="nav-group-wrapper">
                        {item.children ? (
                            <>
                                <button
                                    className={`nav-item nav-parent ${isGroupActive(item) ? 'active-parent' : ''}`}
                                    onClick={() => toggleGroup(item.label)}
                                >
                                    <div className="nav-item-content">
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                    <span className={`material-symbols-outlined chevron ${expandedGroups.includes(item.label) ? 'expanded' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                                <div className={`nav-children ${expandedGroups.includes(item.label) ? 'show' : ''}`}>
                                    {item.children.map(child => (
                                        <NavLink
                                            key={child.to}
                                            to={child.to}
                                            className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                                            onClick={onClose}
                                        >
                                            <span>{child.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <NavLink
                                to={item.to!}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <div className="nav-item-content">
                                    <span className="material-symbols-outlined">{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            </NavLink>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer with User Info */}
            <div className="sidebar-footer">
                <NavLink to="/settings" className="nav-item">
                    <span className="material-symbols-outlined">settings</span>
                    <span>Pengaturan</span>
                </NavLink>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user?.fullname?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar-user-info">
                        <h4>{user?.fullname || 'User'}</h4>
                        <p>{user?.role || 'Operator'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
