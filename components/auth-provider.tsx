'use client'

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '@/lib/db';
import { firebaseUser } from '@/lib/db';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
    user: firebaseUser | null;
    setUser: React.Dispatch<React.SetStateAction<firebaseUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<firebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, u => {
            if (u) {
                setUser(u);
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { AuthProvider, useAuth };