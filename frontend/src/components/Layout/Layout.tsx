import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { LayoutContext } from '../../contexts/LayoutContext';
import { getPageTitle } from '../../utils/routeUtils';

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
                        <Outlet />
                    </main>
                </div>
            </div>
        </LayoutContext.Provider>
    );
};

export default Layout;
