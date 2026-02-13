import { createContext, useContext } from 'react';
import { logger } from '../utils/logger';

interface LayoutContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        // Return default values to avoid crashing if used outside Layout (though it shouldn't happen)
        return {
            isSidebarOpen: false,
            toggleSidebar: () => logger.warn('useLayout used outside LayoutProvider'),
            closeSidebar: () => logger.warn('useLayout used outside LayoutProvider'),
        };
    }
    return context;
};
