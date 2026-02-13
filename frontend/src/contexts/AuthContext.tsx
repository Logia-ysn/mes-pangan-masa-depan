import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
    id: number;
    email: string;
    fullname: string;
    role: string;
    id_factory?: number;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await authApi.getMe();
                setUser(res.data);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        setUser(res.data.user);
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore logout errors
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
