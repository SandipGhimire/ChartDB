export type DiagramMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface DiagramMember {
    id: string;
    userId: string;
    role: DiagramMemberRole;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/diagrams${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

    if (res.status === 204) {
        return undefined as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            typeof data.error === 'string' ? data.error : 'Request failed'
        );
    }

    return data as T;
}

export const listDiagramMembers = (diagramId: string) =>
    request<{ members: DiagramMember[] }>(`/${diagramId}/members`);

export const addDiagramMember = (
    diagramId: string,
    email: string,
    role: DiagramMemberRole
) =>
    request<{ member: DiagramMember }>(`/${diagramId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
    });

export const updateDiagramMemberRole = (
    diagramId: string,
    userId: string,
    role: DiagramMemberRole
) =>
    request<{ member: DiagramMember }>(`/${diagramId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    });

export const removeDiagramMember = (diagramId: string, userId: string) =>
    request<void>(`/${diagramId}/members/${userId}`, { method: 'DELETE' });
