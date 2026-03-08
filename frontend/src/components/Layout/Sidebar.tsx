import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/pmd_logo.png';
import './Sidebar.css';

interface NavItemConfig {
    label: string;
    icon: string;
    to?: string;
    children?: { label: string; to: string; icon?: string }[];
}

const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
    const { user } = useAuth();

    const navItems: NavItemConfig[] = [
        { label: 'Dashboard', icon: 'dashboard', to: '/' },
        {
            label: 'Penerimaan Material',
            icon: 'local_shipping',
            children: [
                { label: 'Purchase Order', to: '/receiving/purchase-orders' },
                { label: 'Penerimaan Bahan Baku', to: '/receiving/raw-materials' },
                { label: 'QC Bahan Baku', to: '/receiving/qc-gabah' },
                { label: 'Supplier', to: '/receiving/suppliers' },
            ]
        },
        {
            label: 'Produksi',
            icon: 'factory',
            children: [
                { label: 'Work Order', to: '/production/work-orders' },
                { label: 'Worksheet Produksi', to: '/production/worksheets' },
                { label: 'Lini Produksi', to: '/production/lines' },
                { label: 'Drying Log', to: '/production/drying-logs' },
                { label: 'Jadwal Produksi', to: '/production/scheduling' },
                { label: 'Shift Handover', to: '/production/shift-handover' },
            ]
        },
        {
            label: 'Kualitas',
            icon: 'verified',
            children: [
                { label: 'QC Produk Jadi', to: '/production/qc-results' },
                { label: 'Parameter Kualitas', to: '/quality/parameters' },
                { label: 'Non-Conformance', to: '/quality/ncr' },
                { label: 'Tren Kualitas', to: '/reports/quality' },
                { label: 'Monitor Rendemen', to: '/production/rendemen' },
            ]
        },
        {
            label: 'Inventory',
            icon: 'warehouse',
            children: [
                { label: 'Stok Real-time', to: '/inventory/stocks' },
                { label: 'Transfer Stok', to: '/inventory/transfers' },
                { label: 'Stock Opname', to: '/inventory/stock-opname' },
                { label: 'Genealogi Batch', to: '/inventory/batch-genealogy' },
            ]
        },
        {
            label: 'Peralatan',
            icon: 'precision_manufacturing',
            children: [
                { label: 'Daftar Mesin', to: '/equipment/machines' },
                { label: 'Maintenance', to: '/equipment/maintenance' },
                { label: 'Downtime Tracking', to: '/equipment/downtime' },
                { label: 'OEE Monitor', to: '/equipment/oee' },
            ]
        },
        {
            label: 'Laporan',
            icon: 'assessment',
            children: [
                { label: 'Laporan Produksi', to: '/reports/production' },
                { label: 'HPP (COGM)', to: '/reports/cogm' },
                { label: 'Laporan Stok', to: '/reports/stock' },
                { label: 'Parameter Proses', to: '/reports/process-params' },
            ]
        },
        ...(user && ['ADMIN', 'SUPERUSER'].includes(user.role) ? [{
            label: 'Admin Panel',
            icon: 'admin_panel_settings',
            children: [
                { label: 'Manajemen Pabrik', to: '/admin/factories' },
                { label: 'Manajemen User', to: '/admin/users' },
                { label: 'Master Produk', to: '/admin/product-types' },
                { label: 'Log Audit', to: '/admin/audit-logs' },
            ]
        }] : [])
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
                        <img src={logo} alt="PMD" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1>MES PMD</h1>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <div key={item.label} className="nav-group-wrapper">
                        {item.children ? (
                            <>
                                {/* Section Header (Static) */}
                                <div className="nav-group-label">
                                    <div className="nav-item-content">
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span>{item.label}</span>
                                    </div>
                                </div>

                                {/* Flat Children List */}
                                <div className="nav-children-flat">
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
