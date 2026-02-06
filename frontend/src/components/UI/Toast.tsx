import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Match animation duration
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'info': return 'info';
            default: return 'info';
        }
    };

    return (
        <div className={`toast toast-${type} ${isExiting ? 'exiting' : ''}`} role="alert">
            <span className="material-symbols-outlined toast-icon">{getIcon()}</span>
            <div className="toast-content">
                <div className="toast-title">{title}</div>
                {message && <div className="toast-message">{message}</div>}
            </div>
            <button className="toast-close material-symbols-outlined icon-sm" onClick={handleClose}>
                close
            </button>
        </div>
    );
};

export default Toast;
