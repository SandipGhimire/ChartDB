import type { AuthUser } from '@/context/auth-context/auth-context';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/auth${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            typeof data.error === 'string' ? data.error : 'Request failed'
        );
    }

    return data as T;
}

export const updateProfile = (name: string) =>
    request<{ user: AuthUser }>('/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
    });

export const changePassword = (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });
