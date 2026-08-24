export interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'USER';
    isActive: boolean;
    createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/admin${path}`, {
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

export const listUsers = () => request<{ users: AdminUser[] }>('/users');

export const createUser = (input: {
    email: string;
    password: string;
    name?: string;
    role: 'ADMIN' | 'USER';
}) =>
    request<{ user: AdminUser }>('/users', {
        method: 'POST',
        body: JSON.stringify(input),
    });

export const updateUser = (
    id: string,
    input: Partial<{
        name: string | null;
        role: 'ADMIN' | 'USER';
        isActive: boolean;
    }>
) =>
    request<{ user: AdminUser }>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });

export const resetUserPassword = (id: string, password: string) =>
    request<{ success: boolean }>(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
    });

export const deactivateUser = (id: string) =>
    request<{ user: AdminUser }>(`/users/${id}`, { method: 'DELETE' });
