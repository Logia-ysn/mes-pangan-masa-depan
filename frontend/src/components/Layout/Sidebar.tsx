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
            label: 'Pembelian',
            icon: 'shopping_cart',
            children: [
                { label: 'Purchase Order', to: '/purchasing/purchase-orders' },
                { label: 'Penerimaan Barang', to: '/purchasing/goods-receipts' },
                { label: 'Supplier', to: '/purchasing/suppliers' },
            ]
        },
        {
            label: 'Penerimaan Bahan',
            icon: 'inventory_2',
            children: [
                { label: 'Daftar Penerimaan', to: '/receiving/raw-materials' },
                { label: 'QC Bahan Baku', to: '/receiving/qc-gabah' },
            ]
        },
        {
            label: 'Produksi',
            icon: 'factory',
            children: [
                { label: 'Worksheet', to: '/production/worksheets' },
                { label: 'Drying Log', to: '/production/drying-logs' },
                { label: 'QC Beras', to: '/production/qc-results' },
            ]
        },
        {
            label: 'Inventory',
            icon: 'warehouse',
            children: [
                { label: 'Stok Real-time', to: '/inventory/stocks' },
                { label: 'Transfer Stok', to: '/inventory/transfers' },
                { label: 'Stock Opname', to: '/inventory/stock-opname' },
            ]
        },
        {
            label: 'Penjualan',
            icon: 'point_of_sale',
            children: [
                { label: 'Pelanggan', to: '/sales/customers' },
                { label: 'Invoice', to: '/sales/invoices' },
                { label: 'Surat Jalan (DO)', to: '/sales/delivery-orders' },
                { label: 'Pembayaran', to: '/sales/payments' },
            ]
        },
        {
            label: 'Keuangan',
            icon: 'account_balance',
            children: [
                { label: 'Pengeluaran Harian', to: '/finance/expenses' },
            ]
        },
        {
            label: 'Mesin & Maintenance',
            icon: 'precision_manufacturing',
            children: [
                { label: 'Daftar Mesin', to: '/equipment/machines' },
                { label: 'Maintenance', to: '/equipment/maintenance' },
                { label: 'OEE Monitor', to: '/equipment/oee' },
            ]
        },
        {
            label: 'Laporan',
            icon: 'assessment',
            children: [
                { label: 'Laporan Produksi', to: '/reports/production' },
                { label: 'Laporan Penjualan', to: '/reports/sales' },
                { label: 'HPP (COGM)', to: '/reports/cogm' },
                { label: 'Laporan Stok', to: '/reports/stock' },
                { label: 'Tren Kualitas', to: '/reports/quality' },
            ]
        },
        // Admin Section (Conditional)
        ...(user && ['ADMIN', 'SUPERUSER'].includes(user.role) ? [{
            label: 'Admin Panel',
            icon: 'admin_panel_settings',
            children: [
                { label: 'Manajemen User', to: '/admin/users' },
                { label: 'Data Karyawan', to: '/admin/employees' },
                { label: 'Absensi Karyawan', to: '/admin/attendance' },
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
