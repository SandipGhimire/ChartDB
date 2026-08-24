import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

export interface AuditLogParams {
    actorUserId: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    diagramId?: string | null;
    metadata?: Record<string, unknown>;
}

// Best-effort: never throws, never awaited by callers in a way that could
// block or fail the request that triggered it.
export const logAudit = (params: AuditLogParams): void => {
    prisma.auditLog
        .create({
            data: {
                actorUserId: params.actorUserId,
                action: params.action,
                targetType: params.targetType,
                targetId: params.targetId ?? null,
                diagramId: params.diagramId ?? null,
                metadata: params.metadata as Prisma.InputJsonValue | undefined,
            },
        })
        .catch((err) => {
            console.error('Failed to write audit log', params.action, err);
        });
};
