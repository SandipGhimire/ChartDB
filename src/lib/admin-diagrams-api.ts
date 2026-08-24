export interface AdminDiagram {
    id: string;
    name: string;
    databaseType: string;
    databaseEdition: string | null;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    tableCount: number;
    ownerEmail: string | null;
}

export type DiagramMemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface AdminDiagramMember {
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
    const res = await fetch(`/api/admin/diagrams${path}`, {
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

export const listAllDiagrams = () => request<{ diagrams: AdminDiagram[] }>('');

export const listAdminDiagramMembers = (diagramId: string) =>
    request<{ members: AdminDiagramMember[] }>(`/${diagramId}/members`);

export const addAdminDiagramMember = (
    diagramId: string,
    email: string,
    role: DiagramMemberRole
) =>
    request<{ member: AdminDiagramMember }>(`/${diagramId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
    });

export const updateAdminDiagramMemberRole = (
    diagramId: string,
    userId: string,
    role: DiagramMemberRole
) =>
    request<{ member: AdminDiagramMember }>(`/${diagramId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
    });

export const removeAdminDiagramMember = (diagramId: string, userId: string) =>
    request<void>(`/${diagramId}/members/${userId}`, { method: 'DELETE' });

export const deleteDiagramAsAdmin = (diagramId: string) =>
    request<void>(`/${diagramId}`, { method: 'DELETE' });

export const updateDiagramAsAdmin = (
    diagramId: string,
    data: {
        name?: string;
        databaseType?: string;
        databaseEdition?: string | null;
    }
) =>
    request<{ diagram: AdminDiagram }>(`/${diagramId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
