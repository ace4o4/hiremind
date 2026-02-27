 
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock Auth: immediately log the user in
        const timer = setTimeout(() => {
            const mockUser = { id: 'mock-user-id', email: 'test@example.com', user_metadata: { full_name: 'Mock Candidate' } } as unknown as User;
            setUser(mockUser);
            setSession({ access_token: 'fake-token', user: mockUser } as Session);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const signUp = async (email: string, password: string, fullName: string) => {
        const mockUser = { id: 'mock-user-id', email, user_metadata: { full_name: fullName } } as unknown as User;
        setUser(mockUser);
        setSession({ access_token: 'fake-token', user: mockUser } as Session);
        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const mockUser = { id: 'mock-user-id', email, user_metadata: { full_name: 'Mock Candidate' } } as unknown as User;
        setUser(mockUser);
        setSession({ access_token: 'fake-token', user: mockUser } as Session);
        return { error: null };
    };

    const signInWithOAuth = async (provider: 'google' | 'github') => {
        const mockUser = { id: 'mock-user-id', email: `${provider}@example.com`, user_metadata: { full_name: 'Mock Candidate' } } as unknown as User;
        setUser(mockUser);
        setSession({ access_token: 'fake-token', user: mockUser } as Session);
        return { error: null };
    };

    const signOut = async () => {
        setUser(null);
        setSession(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithOAuth, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
