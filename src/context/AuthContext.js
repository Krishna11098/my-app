'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.role === 'VENDOR') {
            router.push('/vendor/dashboard');
        } else {
            router.push('/dashboard'); // Or home
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Also hit an API to clear the httpOnly cookie if strictly needed, 
        // but for now client-side clear is effective for UI.
        // router.push('/api/auth/logout'); 
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
