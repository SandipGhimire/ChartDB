import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'USER';
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContext {
    user?: AuthUser;
    status: AuthStatus;
    login: (
        email: string,
        password: string
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateUser: (user: AuthUser) => void;
}

export const authContext = createContext<AuthContext>({
    user: undefined,
    status: 'loading',
    login: emptyFn,
    logout: emptyFn,
    updateUser: emptyFn,
});
