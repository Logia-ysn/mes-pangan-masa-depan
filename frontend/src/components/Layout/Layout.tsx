import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutContext } from '../../contexts/LayoutContext';
import Breadcrumbs from '../UI/Breadcrumbs';
import { getPageTitle, getBreadcrumbs } from '../../utils/routeUtils';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const { title, subtitle } = getPageTitle(location.pathname);
    const breadcrumbs = getBreadcrumbs(location.pathname);

    return (
        <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
            <div className="app">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={closeSidebar}></div>
                )}

                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

                <div className="main-container">
                    <Header title={title} subtitle={subtitle} />
                    <main className="main-content">
                        <Breadcrumbs items={breadcrumbs} />
                        <Outlet />
                    </main>
                </div>
            </div>
        </LayoutContext.Provider>
    );
};

export default Layout;
