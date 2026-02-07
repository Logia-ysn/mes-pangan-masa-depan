import React, { createContext, useContext, useCallback } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
    // Add generic toast method if needed
    toast: typeof toast;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const showSuccess = useCallback((title: string, message?: string) => {
        toast.success(message ? `${title}: ${message}` : title);
    }, []);

    const showError = useCallback((title: string, message?: string) => {
        toast.error(message ? `${title}: ${message}` : title, { duration: 5000 });
    }, []);

    const showWarning = useCallback((title: string, message?: string) => {
        toast(message ? `${title}: ${message}` : title, {
            icon: '⚠️',
            style: {
                background: '#FFF3CD',
                color: '#856404',
            }
        });
    }, []);

    const showInfo = useCallback((title: string, message?: string) => {
        toast(message ? `${title}: ${message}` : title, {
            icon: 'ℹ️',
        });
    }, []);

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo, toast }}>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#333',
                        color: '#fff',
                        zIndex: 9999,
                    },
                    success: {
                        style: {
                            background: '#155724',
                        }
                    },
                    error: {
                        style: {
                            background: '#721c24',
                        }
                    }
                }}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
