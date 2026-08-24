export interface AuditLogEntry {
    id: string;
    actorUserId: string | null;
    actor: { email: string } | null;
    action: string;
    targetType: string;
    targetId: string | null;
    diagramId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
}

export interface ListAuditLogResult {
    entries: AuditLogEntry[];
    page: number;
    pageSize: number;
    total: number;
}

export const listAuditLog = async (params: {
    page?: number;
    pageSize?: number;
    actorUserId?: string;
    action?: string;
}): Promise<ListAuditLogResult> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.actorUserId) query.set('actorUserId', params.actorUserId);
    if (params.action) query.set('action', params.action);

    const res = await fetch(`/api/admin/audit-log?${query.toString()}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            typeof data.error === 'string' ? data.error : 'Request failed'
        );
    }

    return data as ListAuditLogResult;
};
