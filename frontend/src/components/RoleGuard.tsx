import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_HIERARCHY = {
    'OPERATOR': 1,
    'SUPERVISOR': 2,
    'MANAGER': 3,
    'ADMIN': 4,
    'SUPERUSER': 5
};

interface RoleGuardProps {
    requiredRole: keyof typeof ROLE_HIERARCHY;
    children: React.ReactNode;
}

const RoleGuard = ({ requiredRole, children }: RoleGuardProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) return null; // Or a smaller loader

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    if (userLevel < requiredLevel) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RoleGuard;
