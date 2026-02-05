import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LayoutContext } from '../../contexts/LayoutContext';
// Based on previous file content, Header was inside pages or not shown in Layout?
// Let's check Layout.tsx again. It was just Sidebar and Main Outlet.
// Wait, where is Header rendered? Usually it's inside the main content or part of Layout.
// Looking at previous `header-left` existing in CSS, Header component exists.
// Let's assume Header should be part of Layout for global access, OR I need to see where Header is used.
// Ah, the previous Layout.tsx was:
// <div className="app"> <Sidebar /> <main className="main-content"> <Outlet /> </main> </div>
// If Header is inside specific pages, I might need to move it up or pass context.
// Let's verify where Header is used first to be safe.
// But commonly in dashboard apps, Header is global.
// Let me quickly check if Header is used in `src/App.tsx` or pages.
// Actually, looking at `Sidebar.css`, it has `.header` styles.
// Let's assume I should integrate Header into Layout to have a proper shell.

// Re-reading Layout.tsx content from history:
// layout was: Sidebar + Main(Outlet).
// I will start by just adding the state and passing it to Sidebar.
// I need to know where Header is to add the toggle button.
// If Header is used in every page, that's annoying to pass props.
// Best practice: Move Header to Layout.

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
            <div className="app">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div className="sidebar-overlay" onClick={closeSidebar}></div>
                )}

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </LayoutContext.Provider>
    );
};


export default Layout;
