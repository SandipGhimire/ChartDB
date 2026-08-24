import React, { useCallback, useEffect, useState } from 'react';
import { authContext } from './auth-context';
import type { AuthStatus, AuthUser } from './auth-context';

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [user, setUser] = useState<AuthUser | undefined>();
    const [status, setStatus] = useState<AuthStatus>('loading');

    useEffect(() => {
        let cancelled = false;

        const loadUser = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    credentials: 'include',
                });

                if (cancelled) return;

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    setStatus('authenticated');
                } else {
                    setUser(undefined);
                    setStatus('unauthenticated');
                }
            } catch {
                if (!cancelled) {
                    setUser(undefined);
                    setStatus('unauthenticated');
                }
            }
        };

        loadUser();

        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return {
                    success: false,
                    error: data.error ?? 'Login failed',
                };
            }

            setUser(data.user);
            setStatus('authenticated');
            return { success: true };
        } catch {
            return { success: false, error: 'Network error' };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // clear client-side state regardless of network errors
        } finally {
            setUser(undefined);
            setStatus('unauthenticated');
        }
    }, []);

    const updateUser = useCallback((updated: AuthUser) => {
        setUser(updated);
    }, []);

    return (
        <authContext.Provider
            value={{ user, status, login, logout, updateUser }}
        >
            {children}
        </authContext.Provider>
    );
};
