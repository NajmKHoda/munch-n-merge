'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser } from '../actions/auth';

interface User {
    id: number;
    username: string;
    email: string;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const userData = await getUser();
        if (userData && 'username' in userData) {
            setUser(userData as User);
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
} 